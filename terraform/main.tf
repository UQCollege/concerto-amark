provider "aws" {
  region = "ap-southeast-2"
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

data "aws_iam_role" "ec2_role" {
  name = "amark-ec2-role"
}

data "aws_iam_instance_profile" "ec2_profile" {
  name = "amark-ec2-profile"
}
data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}

resource "aws_security_group" "amark_sg_private" {
  name        = "amark-security-group-private"
  description = "Allow CloudFront and bastion access"
  vpc_id      = var.vpcID

  ingress {
    description     = "Allow from CloudFront"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    prefix_list_ids = [data.aws_ec2_managed_prefix_list.cloudfront.id]
  }

  ingress {
    description = "Allow Local Access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}


resource "aws_instance" "amark_ec2_private" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.medium"
  subnet_id              = var.private_subnet_id
  vpc_security_group_ids = [aws_security_group.amark_sg_private.id]
  iam_instance_profile   = data.aws_iam_instance_profile.ec2_profile.name
  key_name               = var.key_name

  metadata_options {
    http_tokens   = "required"
    http_endpoint = "enabled"
  }

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
                  image: ${var.ecr_url}
                  ports:
                    - "8000:8000"
                  volumes:
                    - ./db:/app/db
                    - ./staticfiles:/app/staticfiles
                  env_file:
                    - .env
                  command: >
                    sh -c "python manage.py migrate &&
                           python manage.py createsuperuser_if_not_exists &&
                           python manage.py collectstatic --noinput &&
                           gunicorn --bind 0.0.0.0:8000 --timeout 120 --workers 5 amarkapi.wsgi:application"
              EOL

              cat <<EOL > .env
              DEBUG=False
              DJANGO_SECRET_KEY=${var.secret_key}
              ALLOWED_HOSTS='*'
              CORS_ALLOW_ALL_ORIGINS=False
              CORS_ALLOWED_ORIGINS=${var.cors_origin_allow}
              DJANGO_SUPERUSER_USERNAME=admin
              DJANGO_SUPERUSER_EMAIL=admin@example.com
              DJANGO_SUPERUSER_PASSWORD=adminpassword
              USE_FAKE_AUTH=False
              COGNITO_REGION='ap-southeast-2'
              USERPOOL_ID=${var.userpool_id}
              APP_CLIENT_ID=${var.app_client_id}
              CSRF_TRUSTED_ORIGINS=${var.csfr_trusted_origins}
              CUSTOM_ORIGIN_HEADER=${var.my-secure-header}
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
    Name = "AmarkAPIServer"
  }
}

output "ec2_id" {
  value = aws_instance.amark_ec2_private.id
}
output "ec2_private_ip" {
  value = aws_instance.amark_ec2_private.private_ip
}
output "ec2_private_dns" {
  value = aws_instance.amark_ec2_private.private_dns
}
