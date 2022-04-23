import { TodosAccess } from '../helpers/todosAcess'
import { getUploadUrl } from '../helpers/attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
// import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
// import * as createError from 'http-errors'
import { TodoUpdate } from '../models/TodoUpdate';

// TODO: Implement businessLogic
const todosAccess = new TodosAccess()

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
  return todosAccess.getTodosForUser(userId)
}
export async function getTodo(todoId: string, userId: string): Promise<TodoItem[]> {
  return todosAccess.todoExists(todoId, userId)
}

export async function createAttachmentPresignedUrl(todoId: string, userId: string): Promise<string> {

  const bucketName = process.env.ATTACHMENT_S3_BUCKET
  todosAccess.updateAttach(todoId, userId, `https://${bucketName}.s3.amazonaws.com/${todoId}`)

  return getUploadUrl(todoId)
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {

  return await todosAccess.createTodo({
    todoId: uuid.v4(),
    userId: userId,
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    createdAt: new Date().toISOString(),
    done : false
  })

}
export async function updateTodo(
    updateTodoRequest: UpdateTodoRequest,
    todoId: string,
    userId: string
  ): Promise<TodoUpdate> {
  
    return await todosAccess.updateTodo({
      todoId: todoId,
      name: updateTodoRequest.name,
      dueDate: updateTodoRequest.dueDate,
      done : true
    }, userId)
}

export async function deleteTodo(
    todoId: string, userId: string
  ): Promise<string> {
  
    return await todosAccess.deleteTodo(todoId, userId)
}