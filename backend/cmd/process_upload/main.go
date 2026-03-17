package main

import "backend/utils"

func init() {
	utils.InitHandlerDependencies(utils.WithDatabase())
}

func main() {

}
