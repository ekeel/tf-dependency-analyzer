terraform {
  backend "s3" {}
  required_version = "~> 0.0.0"
  required_providers {
    aws = {
      version = "~> 1.1.1"
    }
    alks = {
      source = "cox-automotive/alks"
    }
  }
}

provider "aws" {
  region = "us-west-2"
  assume_role {}
  default_tags {}
  ignore_tags {}
}

module "s3_bucket" {
  source = "git@github.com:terraform-aws-modules/terraform-aws-s3-bucket.git?ref=3.11.1"

  bucket = "my-s3-bucket"
  acl    = "private"

  control_object_ownership = true
  object_ownership         = "ObjectWriter"

  versioning = {
    enabled = true
  }
}