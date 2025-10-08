package utils

import (
	"context"
	"log"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

const (
	SEARCH_TABLE           = "SEARCH_TABLE"
	MAIN_TABLE             = "USERS_TABLE"
	USER_POOL_ID           = "USER_POOL_ID"
	CLOUDFRONT_DOMAIN_NAME = "CLOUDFRONT_DOMAIN_NAME"
	MEDIA_BUCKET           = "MEDIA_BUCKET"
)

type HandlerDependencies struct {
	DbClient             *dynamodb.Client
	CognitoClient        *cognitoidentityprovider.Client
	S3Client             *s3.Client
	BucketName           string
	TableName            string
	SearchTableName      string
	UserPoolId           string
	CloudFrontDomainName string
}

type option func(*HandlerDependencies, aws.Config)

func getConfig() aws.Config {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Panicf("Unable to load sdk config, reason: %v", err)
	}

	return cfg
}

func getEnvironmentVariable(key string) string {
	val := os.Getenv(key)
	if val == "" {
		log.Panicf("%v environment variable not set!", key)
	}

	return val
}

func WithDatabase() option {
	return func(hd *HandlerDependencies, c aws.Config) {
		hd.TableName = getEnvironmentVariable(MAIN_TABLE)
		hd.SearchTableName = getEnvironmentVariable(SEARCH_TABLE)
		hd.DbClient = dynamodb.NewFromConfig(c)
	}
}

func WithCognito() option {
	return func(hd *HandlerDependencies, c aws.Config) {
		hd.CognitoClient = cognitoidentityprovider.NewFromConfig(c)
		hd.UserPoolId = getEnvironmentVariable(USER_POOL_ID)
	}
}

func WithBucket() option {
	return func(hd *HandlerDependencies, c aws.Config) {
		hd.BucketName = getEnvironmentVariable(MEDIA_BUCKET)
		hd.S3Client = s3.NewFromConfig(c)
	}
}

func InitHandlerDependencies(opts ...option) *HandlerDependencies {
	cfg := getConfig()
	deps := &HandlerDependencies{}

	deps.CloudFrontDomainName = getEnvironmentVariable(CLOUDFRONT_DOMAIN_NAME)

	for _, opt := range opts {
		opt(deps, cfg)
	}

	return deps
}
