import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader,
  Progress
} from 'semantic-ui-react'

import { createTask, deleteTask, getTasks, patchTask } from '../api/todos-api'
import Auth from '../auth/Auth'
import { Task } from '../types/Task'

interface TasksProps {
  auth: Auth
  history: History
}

interface TasksState {
  tasks: Task[]
  newTaskName: string
  loadingTasks: boolean
}

export class Tasks extends React.PureComponent<TasksProps, TasksState> {
  state: TasksState = {
    tasks: [],
    newTaskName: '',
    loadingTasks: true
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newTaskName: event.target.value })
  }

  onEditButtonClick = (todoId: string) => {
    this.props.history.push(`/todos/${todoId}/edit`)
  }

  onTaskCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      const dueDate = this.calculateDueDate()
      const newTask = await createTask(this.props.auth.getIdToken(), {
        name: this.state.newTaskName,
        dueDate
      })
      console.log("new", newTask);

      this.setState({
        tasks: [...this.state.tasks, newTask],
        newTaskName: ''
      })
    } catch {
      alert('Task creation failed')
    }
  }

  onTaskDelete = async (todoId: string) => {
    try {
      await deleteTask(this.props.auth.getIdToken(), todoId)
      this.setState({
        tasks: this.state.tasks.filter(task => task.todoId !== todoId)
      })
    } catch {
      alert('Task deletion failed')
    }
  }

  onTaskFinish = async (pos: number) => {
    try {
      const task = this.state.tasks[pos]
      
      await patchTask(this.props.auth.getIdToken(), task.todoId, {
        name: task.name,
        dueDate: task.dueDate,
        done: !task.done
      })
      this.setState({
        tasks: update(this.state.tasks, {
          [pos]: { done: { $set: !task.done } }
        })
      })
    } catch {
      alert('Task complete failed')
    }
  }

  async componentDidMount() {
    try {
      const tasks = await getTasks(this.props.auth.getIdToken())
      this.setState({
        tasks,
        loadingTasks: false
      })
    } catch (e) {
      alert(`Failed to fetch tasks: ${e}`)
    }
  }

  render() {
    return (
      <div>
        <Header as="h1">Tasks</Header>

        {this.renderCreateTaskInput()}

        {this.renderTasks()}
      </div>
    )
  }

  renderCreateTaskInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
              labelPosition: 'left',
              icon: 'add',
              content: 'New',
              onClick: this.onTaskCreate
            }}
            fluid
            actionPosition="left"
            placeholder="Task name"
            onChange={this.handleNameChange}
          />
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderTasks() {
    if (this.state.loadingTasks) {
      return this.renderLoading()
    }

    return this.renderTodosList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading Tasks
        </Loader>
      </Grid.Row>
    )
  }

  renderTodosList() {
    return (
      <Grid padded>
        {this.state.tasks.map((task, pos) => {
          return (
            <Grid.Row key={task.todoId}>
              <Grid.Column width={10} verticalAlign="middle">
                {task.name}
              </Grid.Column>
              <Grid.Column width={3} floated="right">
                {task.dueDate}
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                {task.done ?
                  <Button
                    icon
                    color="green"
                    disabled
                  >
                    <Icon name="check circle" />
                  </Button>
                  :
                  <Button
                    icon
                    color="green"
                    onClick={() => this.onTaskFinish(pos)}
                  >
                    <Icon name="check circle" />
                  </Button>}

              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="blue"
                  onClick={() => this.onEditButtonClick(task.todoId)}
                >
                  <Icon name="pencil" />
                </Button>
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="red"
                  onClick={() => this.onTaskDelete(task.todoId)}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Column>
              {task.attachmentUrl && (
                <Image src={task.attachmentUrl} size="small" wrapped />
              )}
              <Grid.Column width={16}>
                <br/>
                {task.done ? <Progress percent={100} success>
                  The task was done
                </Progress> 
                : 
                <Progress percent={100} active>
                </Progress>}
                
                <Divider />
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

  calculateDueDate(): string {
    const date = new Date()
    date.setDate(date.getDate() + 7)

    return dateFormat(date, 'yyyy-mm-dd') as string
  }
}
