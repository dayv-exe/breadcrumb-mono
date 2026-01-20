package main

import "backend/utils"

func init() {
	utils.InitHandlerDependencies(utils.WithBucket(), utils.WithDatabase())
}

func main() {
	// como esta?
}
