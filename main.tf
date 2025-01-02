provider "aws" {
    region = "ap-southeast-2"  
}

# Security Group for EC2 Instance
resource "aws_security_group" "todo-sg-group" {
    name        = "ec2_security_group_uq"
    description = "Allow inbound traffic for HTTP and SSH"
    
    ingress {
        from_port   = 80
        to_port     = 80
        protocol    = "tcp"
        cidr_blocks = ["0.0.0.0/0"]  # Allow traffic from anywhere
    }

    ingress {
        from_port   = 22
        to_port     = 22
        protocol    = "tcp"
        cidr_blocks = ["0.0.0.0/0"]  # Allow SSH access from anywhere
    }
    
    egress {
        from_port   = 0
        to_port     = 0
        protocol    = "-1"  # Allow all outbound traffic
        cidr_blocks = ["0.0.0.0/0"]
    }

    tags = {
        Name = "EC2SecurityGroup"
    }
}

# EC2 Instance Configuration
resource "aws_instance" "todo_instance" {
    ami           = "ami-0d6560f3176dc9ec0"  # Update with your preferred AMI
    instance_type = "t2.micro"
    key_name      = "bert"  
    security_groups = [aws_security_group.todo-sg-group.name]  # Link security group

    # User data to install Docker and AWS CLI
    user_data = <<-EOF
                #!/bin/bash
                sudo yum update -y
                sudo yum install -y docker
                sudo service docker start
                sudo usermod -aG docker ec2-user
                sudo yum install git -y
                curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
                unzip awscliv2.zip
                sudo ./aws/install
                EOF

    tags = {
        Name = "TodoAppInstance"  
    }
}

# KMS Key for Encrypting Secrets
# resource "aws_kms_key" "db_kms_key" {
#     description = "KMS key for encrypting RDS database credentials"

#     tags = {
#         Name = "RDS-KMS-Key"
#     }
# }

# Secrets Manager for Database Credentials
resource "aws_secretsmanager_secret" "db_creds" {
    name        = "db-credentials"
    description = "MySQL database credentials"

    tags = {
        Name = "MySQLDatabaseCredentials"
    }
}

resource "aws_secretsmanager_secret_version" "db_creds_version" {
    secret_id     = aws_secretsmanager_secret.db_creds.id
    secret_string = jsonencode({
        username = "admin"  # Replace with your desired username
        password = "bert050904"  # Replace with a strong password
    })
}

# Security Group for RDS Instance
resource "aws_security_group" "rds_sg" {
    name        = "rds_security_group_uq"
    description = "Allow inbound traffic for MySQL"
    
    ingress {
        from_port   = 3306
        to_port     = 3306
        protocol    = "tcp"
        cidr_blocks = ["0.0.0.0/0"]  # Update this to restrict access
    }

    egress {
        from_port   = 0
        to_port     = 0
        protocol    = "-1"  # Allow all outbound traffic
        cidr_blocks = ["0.0.0.0/0"]
    }

    tags = {
        Name = "RDSSecurityGroup"
    }
}

# RDS MySQL Database Instance
resource "aws_db_instance" "mysql_db" {
    allocated_storage    = 20
    engine             = "mysql"
    engine_version     = "8.0.35"
    instance_class     = "db.t3.micro"
    db_name            = "todo_app_db"
    username           = jsondecode(aws_secretsmanager_secret_version.db_creds_version.secret_string)["username"]
    password           = jsondecode(aws_secretsmanager_secret_version.db_creds_version.secret_string)["password"]
    publicly_accessible = true
    skip_final_snapshot = true
    vpc_security_group_ids = [aws_security_group.rds_sg.id]
    tags = {
        Name = "MySQLDatabase"
    }
}