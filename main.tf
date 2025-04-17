provider "aws" {
  region = "ap-southeast-2"
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnet" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }

  filter {
    name   = "default-for-az"
    values = ["true"]
  }

  availability_zone = "ap-southeast-2a"
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_iam_role" "ec2_role" {
  name = "amark-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "ec2.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecr_readonly" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "amark-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

resource "aws_security_group" "amark_sg" {
  name        = "amark-security-group"
  description = "Allow 8000 access"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "amark_ec2" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = "t3.micro"
  associate_public_ip_address = true
  subnet_id                   = data.aws_subnet.default.id
  vpc_security_group_ids      = [aws_security_group.amark_sg.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name
  key_name                    = var.key_name


  user_data = <<-EOF
              #!/bin/bash
              apt update -y
              apt install -y docker.io docker-compose awscli
              usermod -aG docker ubuntu
              systemctl enable docker

              mkdir -p /home/ubuntu/amark-app/db
              cd /home/ubuntu/amark-app

              cat <<EOL > docker-compose.yaml
              services:
                amark:
                  image: ${var.ecr_url}/amark-api:latest
                  ports:
                    - "8000:8000"
                  volumes:
                    - ./db:/app/db
                    - ./staticfiles:/app/staticfiles
                  env_file:
                    - .env
              EOL

              cat <<EOL > .env
              DEBUG=False
              DJANGO_SECRET_KEY=${var.secret_key}
              ALLOWED_HOSTS='*'
              CORS_ALLOW_ALL_ORIGINS=True
              CORS_ORIGIN_ALLOW_ORIGINS='*'
              DJANGO_SUPERUSER_USERNAME=admin
              DJANGO_SUPERUSER_EMAIL=admin@example.com
              DJANGO_SUPERUSER_PASSWORD=adminpassword
              USE_FAKE_AUTH=False
              COGNITO_REGION='ap-southeast-2'
              USERPOOL_ID=${var.userpool_id}
              APP_CLIENT_ID=${var.app_client_id}
              EOL

              cat <<EOL > start-amark.sh
              #!/bin/bash
              cd /home/ubuntu/amark-app
              aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin ${var.ecr_url}
              docker-compose pull
              docker-compose up -d
              EOL

              chmod +x start-amark.sh

              cat <<EOL > /etc/systemd/system/amark.service
              [Unit]
              Description=Amark Docker Compose App
              After=network.target docker.service
              Requires=docker.service

              [Service]
              Type=oneshot
              ExecStart=/home/ubuntu/amark-app/start-amark.sh
              RemainAfterExit=true

              [Install]
              WantedBy=multi-user.target
              EOL

              systemctl daemon-reload
              systemctl enable amark.service
              /home/ubuntu/amark-app/start-amark.sh
              EOF

  tags = {
    Name = "AmarkAppServer"
  }
}

output "instance_public_ip" {
  value = aws_instance.amark_ec2.public_ip
}
