package handlers

import (
	"backend/constants"
	"backend/utils"
	"context"
	"fmt"

	"github.com/aws/aws-lambda-go/events"
)

func HandlePresignup(ctx context.Context, event events.CognitoEventUserPoolsPreSignup) (events.CognitoEventUserPoolsPreSignup, error) {
	// runs before user is added to cognito user pool

	birthdate := event.Request.UserAttributes["birthdate"]

	// birthdate check
	validBirthdate, err := utils.BirthdateIsValid(birthdate)

	if err != nil {
		return event, fmt.Errorf("Birthdate is in a wrong format, it should be DD/MM/YYYY! ERROR: %s.", err)
	}

	if !validBirthdate {
		return event, fmt.Errorf("Birthdate is invalid, users must be between %d and %d years old, expected format is dd/mm/yyyy", constants.MIN_AGE, constants.MAX_AGE)
	}
	return event, nil
}
