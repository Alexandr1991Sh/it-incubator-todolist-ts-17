import { TaskPriorities, TaskStatuses, TaskType, todolistsAPI, UpdateTaskModelType } from "api/todolists-api"
import { Dispatch } from "redux"
import { AppRootStateType, AppThunk } from "app/store"
import { appActions } from "app/app-reducer"
import { handleServerAppError, handleServerNetworkError } from "utils/error-utils"
import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { todolistsActions } from "features/TodolistsList/todolistsSlice"

const slice = createSlice({
  name: "tasks",
  initialState: {} as TasksStateType,
  reducers: {
    removeTaskAC: (state, action: PayloadAction<{ taskId: string; todolistId: string }>) => {
      const tasks = state[action.payload.todolistId]
      const index = tasks.findIndex((t) => t.id === action.payload.taskId)
      if (index !== -1) {
        tasks.splice(index, 1)
      }
    },
    addTaskAC: (state, action: PayloadAction<{ task: TaskType }>) => {
      state[action.payload.task.todoListId].unshift(action.payload.task)
    },
    updateTaskAC: (
      state,
      action: PayloadAction<{ taskId: string; model: UpdateDomainTaskModelType; todolistId: string }>,
    ) => {
      const tasks = state[action.payload.todolistId]

      const index = tasks.findIndex((t) => t.id === action.payload.taskId)
      if (index !== -1) {
        tasks[index] = { ...tasks[index], ...action.payload.model }
      }
    },
    setTasksAC: (state, action: PayloadAction<{ tasks: Array<TaskType>; todolistId: string }>) => {
      state[action.payload.todolistId] = action.payload.tasks
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(todolistsActions.addTodolistAC, (state, action) => {
        state[action.payload.todolist.id] = []
      })
      .addCase(todolistsActions.removeTodolistAC, (state, action) => {
        delete state[action.payload.id]
      })
      .addCase(todolistsActions.setTodolistsAC, (state, action) => {
        action.payload.todolists.forEach((tl) => {
          state[tl.id] = []
        })
      })
  },
})

// thunks
export const fetchTasksTC =
  (todolistId: string): AppThunk =>
  (dispatch: Dispatch) => {
    dispatch(appActions.setAppStatusAC({ status: "loading" }))
    todolistsAPI.getTasks(todolistId).then((res) => {
      const tasks = res.data.items
      dispatch(tasksActions.setTasksAC({ tasks, todolistId }))
      dispatch(appActions.setAppStatusAC({ status: "succeeded" }))
    })
  }
export const removeTaskTC =
  (taskId: string, todolistId: string): AppThunk =>
  (dispatch) => {
    todolistsAPI.deleteTask(todolistId, taskId).then((res) => {
      const action = tasksActions.removeTaskAC({ taskId, todolistId })
      dispatch(action)
    })
  }
export const addTaskTC =
  (title: string, todolistId: string): AppThunk =>
  (dispatch) => {
    dispatch(appActions.setAppStatusAC({ status: "loading" }))
    todolistsAPI
      .createTask(todolistId, title)
      .then((res) => {
        if (res.data.resultCode === 0) {
          const task = res.data.data.item
          const action = tasksActions.addTaskAC({ task })
          dispatch(action)
          dispatch(appActions.setAppStatusAC({ status: "succeeded" }))
        } else {
          handleServerAppError(res.data, dispatch)
        }
      })
      .catch((error) => {
        handleServerNetworkError(error, dispatch)
      })
  }
export const updateTaskTC =
  (taskId: string, domainModel: UpdateDomainTaskModelType, todolistId: string): AppThunk =>
  (dispatch, getState: () => AppRootStateType) => {
    const state = getState()
    const task = state.tasks[todolistId].find((t) => t.id === taskId)
    if (!task) {
      //throw new Error("task not found in the state");
      console.warn("task not found in the state")
      return
    }

    const apiModel: UpdateTaskModelType = {
      deadline: task.deadline,
      description: task.description,
      priority: task.priority,
      startDate: task.startDate,
      title: task.title,
      status: task.status,
      ...domainModel,
    }

    todolistsAPI
      .updateTask(todolistId, taskId, apiModel)
      .then((res) => {
        if (res.data.resultCode === 0) {
          const action = tasksActions.updateTaskAC({
            taskId: taskId,
            model: domainModel,
            todolistId: todolistId,
          })
          dispatch(action)
        } else {
          handleServerAppError(res.data, dispatch)
        }
      })
      .catch((error) => {
        handleServerNetworkError(error, dispatch)
      })
  }

// types
export type UpdateDomainTaskModelType = {
  title?: string
  description?: string
  status?: TaskStatuses
  priority?: TaskPriorities
  startDate?: string
  deadline?: string
}
export type TasksStateType = {
  [key: string]: Array<TaskType>
}

export const tasksReducer = slice.reducer
export const tasksActions = slice.actions
