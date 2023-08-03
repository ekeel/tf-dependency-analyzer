terraform {
  backend "s3" {}
  required_version = "~> 0.0.0"
  required_providers {
    aws = {
      version = "~> 1.1.1"
    }
  }
}

provider "aws" {
  region = "us-west-2"
  assume_role {}
  default_tags {}
  ignore_tags {}
}