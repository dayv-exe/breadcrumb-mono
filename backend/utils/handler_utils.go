package utils

import (
	"context"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
)

const (
	SEARCH_TABLE           = "SEARCH_TABLE"
	MAIN_TABLE             = "USERS_TABLE"
	USER_POOL_ID           = "USER_POOL_ID"
	CLOUDFRONT_DOMAIN_NAME = "CLOUDFRONT_DOMAIN"
	MEDIA_BUCKET           = "MEDIA_BUCKET"
	QUEUE                  = "QUEUE_URL"
	SECRET_ARN             = "CF_PRIVATE_KEY_SECRET_ARN"
	MAPBOX_SECRET_ARN      = "MAPBOX_SECRET_ARN"
)

type handlerDependenciesType struct {
	DbClient             *dynamodb.Client
	CognitoClient        *cognitoidentityprovider.Client
	S3Client             *s3.Client
	SqsClient            *sqs.Client
	BucketName           string
	MainTableName        string
	SearchTableName      string
	UserPoolId           string
	CloudFrontDomainName string
	QueueUrl             string
	SecretsManager       *secretsmanager.Client
	SecretArn            string
	MapboxSecretArn      string
}

var handlerDependencies handlerDependenciesType //

func GetDependencies() *handlerDependenciesType {
	return &handlerDependencies
}

type option func(*handlerDependenciesType, aws.Config)

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

func WithDatabaseAndNoQueue() option {
	return func(hd *handlerDependenciesType, c aws.Config) {
		hd.MainTableName = getEnvironmentVariable(MAIN_TABLE)
		hd.SearchTableName = getEnvironmentVariable(SEARCH_TABLE)
		hd.DbClient = dynamodb.NewFromConfig(c)
	}
}

func WithDatabase() option {
	return func(hd *handlerDependenciesType, c aws.Config) {
		hd.MainTableName = getEnvironmentVariable(MAIN_TABLE)
		hd.SearchTableName = getEnvironmentVariable(SEARCH_TABLE)
		hd.DbClient = dynamodb.NewFromConfig(c)
		hd.QueueUrl = getEnvironmentVariable(QUEUE)
		hd.SqsClient = sqs.NewFromConfig(c)
	}
}

func WithCognito() option {
	return func(hd *handlerDependenciesType, c aws.Config) {
		hd.CognitoClient = cognitoidentityprovider.NewFromConfig(c)
		hd.UserPoolId = getEnvironmentVariable(USER_POOL_ID)
	}
}

func WithCognitoClientOnly() option {
	// for sam functions triggered by cognito actions that cant have user pool id in environment var
	return func(hd *handlerDependenciesType, c aws.Config) {
		hd.CognitoClient = cognitoidentityprovider.NewFromConfig(c)
	}
}

func LateInitUserPoolId(userPoolId string) {
	// get the user pool id from the event parameter after function is triggered
	handlerDependencies.UserPoolId = userPoolId
}

func WithBucket() option {
	return func(hd *handlerDependenciesType, c aws.Config) {
		hd.BucketName = getEnvironmentVariable(MEDIA_BUCKET)
		hd.S3Client = s3.NewFromConfig(c)
	}
}

func WithSecrets() option {
	return func(hd *handlerDependenciesType, c aws.Config) {
		hd.SecretArn = getEnvironmentVariable(SECRET_ARN)
		hd.MapboxSecretArn = getEnvironmentVariable(MAPBOX_SECRET_ARN)
		hd.SecretsManager = secretsmanager.NewFromConfig(c)
	}
}

func InitHandlerDependencies(opts ...option) {
	cfg := getConfig()

	// init cloudfront always
	handlerDependencies.CloudFrontDomainName = getEnvironmentVariable(CLOUDFRONT_DOMAIN_NAME)

	for _, opt := range opts {
		opt(&handlerDependencies, cfg)
	}
}

var authenticatedUserid *string

func ResolveAuthenticatedUser(req events.APIGatewayV2HTTPRequest) {
	authenticatedUserid = aws.String(getAuthUserId(req))
}

func GetAuthenticatedUserid() string {
	return *authenticatedUserid
}
