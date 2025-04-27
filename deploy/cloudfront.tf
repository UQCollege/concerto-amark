resource "aws_cloudfront_origin_request_policy" "custom_policy" {
  name = "CustomHeaderForwardingPolicy"

  headers_config {
    header_behavior = "whitelist"
    headers {
      items = [
        "X-Custom-Origin"
      ]
    }
  }

  query_strings_config {
    query_string_behavior = "none"
  }

  cookies_config {
    cookie_behavior = "all"
  }
}

resource "aws_cloudfront_cache_policy" "custom_cache_policy" {
  name = "CustomCachePolicy"

  default_ttl = 3600
  max_ttl     = 86400 # Max TTL (1 day)
  min_ttl     = 0     # Min TTL (no lower than 0)

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true

    headers_config {
      header_behavior = "whitelist"
      headers {
        items = ["Host", "X-Custom-Origin"]
      }
    }

    cookies_config {
      cookie_behavior = "all"
    }

    query_strings_config {
      query_string_behavior = "all"
    }
  }
}



resource "aws_cloudfront_distribution" "api" {
  origin {
    domain_name = var.domain_name
    origin_id   = "EC2Origin"
    custom_origin_config {
      http_port              = 8000
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled         = true
  is_ipv6_enabled = true
  comment         = "CloudFront distribution for EC2 backend"
  price_class     = "PriceClass_100"

  default_cache_behavior {
    target_origin_id       = "EC2Origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = aws_cloudfront_cache_policy.custom_cache_policy.id # Managed policy: CachingOptimized

    origin_request_policy_id = aws_cloudfront_origin_request_policy.custom_policy.id # Managed: AllViewerExceptHostHeader


  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

