import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')
// TODO: Implement the dataLayer logic
export class TodosAccess {

    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly todosTable = process.env.TODOS_TABLE) {
    }
    async todoExists(todoId: string, userId: string) {
        const result = await this.docClient.query({
            TableName: this.todosTable,
            KeyConditionExpression: 'todoId = :todoId AND userId = :userId',
            ExpressionAttributeValues: {
                ':todoId': todoId,
                ':userId':userId
            }
          }).promise()

          const items = result.Items

          return items as TodoItem[]
      }

    async getTodosForUser(userId: string): Promise<TodoItem[]> {
        console.log('Getting all todos for user')

        const result = await this.docClient.query({
            TableName: this.todosTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
          ':userId': userId
      }
        }).promise()

        const items = result.Items
        logger.info('list to do for user', {
            // Additional information stored with a log statement
            key: items.length
            })
        return items as TodoItem[]
    }

    async createTodo(todo: TodoItem): Promise<TodoItem> {
        await this.docClient.put({
            TableName: this.todosTable,
            Item: todo
        }).promise()

        return todo
    }

    async updateTodo(todo: TodoUpdate, userId: string): Promise<TodoUpdate> {
        const params = {
            TableName: this.todosTable,
            Key: {
              userId: userId,
              todoId: todo.todoId,
            },
            ExpressionAttributeNames: {"#N": "name"},
            UpdateExpression: "SET #N = :name, dueDate = :dueDate, done = :done",
            ExpressionAttributeValues: {
              ":name": todo.name,
              ":dueDate": todo.dueDate,
              ":done": todo.done,
            },
            ReturnValues: "UPDATED_NEW"
          };
        await this.docClient.update(params).promise()

        return todo
    }

    async updateAttach(todoId: string,
        userId: string,
        attachmentUrl: string): Promise<void> {
        const params = {
            TableName: this.todosTable,
            Key: {
                userId: userId,
                todoId: todoId,
            },
            ExpressionAttributeNames: {"#URL": "attachmentUrl"},
            UpdateExpression: "SET #URL = :attachmentUrl",
            ExpressionAttributeValues: {
                ":attachmentUrl": attachmentUrl,
            },
            ReturnValues: "UPDATED_NEW"
        }
        await this.docClient.update(params).promise()

    }

    async deleteTodo(todoId: string, userId: string): Promise<string> {
        await this.docClient.delete({
            TableName: this.todosTable,
            Key : {
                todoId: todoId,
                userId: userId
            }
        }).promise()

        return todoId
    }
}
function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
        console.log('Creating a local DynamoDB instance')
        return new XAWS.DynamoDB.DocumentClient({
            region: 'localhost',
            endpoint: 'http://localhost:8000'
        })
    }

    return new XAWS.DynamoDB.DocumentClient()
}

// TODO: Implement the dataLayer logic