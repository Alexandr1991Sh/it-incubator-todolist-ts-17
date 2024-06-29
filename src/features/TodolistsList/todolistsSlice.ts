import { todolistsAPI, TodolistType } from "api/todolists-api"
import { appActions, RequestStatusType } from "app/app-reducer"
import { handleServerNetworkError } from "utils/error-utils"
import { AppThunk } from "app/store"
import { createSlice, current, PayloadAction } from "@reduxjs/toolkit"

const slice = createSlice({
  name: "todolists",
  initialState: [] as TodolistDomainType[],
  reducers: {
    removeTodolistAC: (state, action: PayloadAction<{ id: string }>) => {
      const index = state.findIndex((todo) => todo.id === action.payload.id)
      if (index !== -1) state.splice(index, 1)
    },
    addTodolistAC: (state, action: PayloadAction<{ todolist: TodolistType }>) => {
      state.unshift({ ...action.payload.todolist, filter: "all", entityStatus: "idle" })
    },
    changeTodolistTitleAC: (state, action: PayloadAction<{ id: string; title: string }>) => {
      const index = state.findIndex((todo) => todo.id === action.payload.id)
      if (index !== -1) {
        state[index].title = action.payload.title
      }
    },
    changeTodolistFilterAC: (state, action: PayloadAction<{ id: string; filter: FilterValuesType }>) => {
      const index = state.findIndex((todo) => todo.id === action.payload.id)
      if (index !== -1) state[index].filter = action.payload.filter
    },
    changeTodolistEntityStatusAC: (state, action: PayloadAction<{ id: string; status: RequestStatusType }>) => {
      const index = state.findIndex((todo) => todo.id === action.payload.id)
      if (index !== -1) state[index].entityStatus = action.payload.status
    },
    setTodolistsAC: (state, action: PayloadAction<{ todolists: Array<TodolistType> }>) => {
      return action.payload.todolists.map((tl) => ({ ...tl, filter: "all", entityStatus: "idle" }))

      // action.payload.todolists.forEach((tl) => {
      //   state.push({ ...tl, filter: "all", entityStatus: "idle" })
      // })
    },
  },
})

// thunks
export const fetchTodolistsTC = (): AppThunk => {
  return (dispatch) => {
    dispatch(appActions.setAppStatusAC({ status: "loading" }))
    todolistsAPI
      .getTodolists()
      .then((res) => {
        dispatch(todolistsActions.setTodolistsAC({ todolists: res.data }))
        dispatch(appActions.setAppStatusAC({ status: "succeeded" }))
      })
      .catch((error) => {
        handleServerNetworkError(error, dispatch)
      })
  }
}
export const removeTodolistTC = (todolistId: string): AppThunk => {
  return (dispatch) => {
    //изменим глобальный статус приложения, чтобы вверху полоса побежала
    dispatch(appActions.setAppStatusAC({ status: "loading" }))
    //изменим статус конкретного тудулиста, чтобы он мог задизеблить что надо
    dispatch(todolistsActions.changeTodolistEntityStatusAC({ id: todolistId, status: "loading" }))
    todolistsAPI.deleteTodolist(todolistId).then((res) => {
      dispatch(todolistsActions.removeTodolistAC({ id: todolistId }))
      //скажем глобально приложению, что асинхронная операция завершена
      dispatch(appActions.setAppStatusAC({ status: "succeeded" }))
    })
  }
}
export const addTodolistTC = (title: string): AppThunk => {
  return (dispatch) => {
    dispatch(appActions.setAppStatusAC({ status: "loading" }))
    todolistsAPI.createTodolist(title).then((res) => {
      dispatch(todolistsActions.addTodolistAC({ todolist: res.data.data.item }))
      dispatch(appActions.setAppStatusAC({ status: "succeeded" }))
    })
  }
}
export const changeTodolistTitleTC = (id: string, title: string): AppThunk => {
  return (dispatch) => {
    todolistsAPI.updateTodolist(id, title).then((res) => {
      dispatch(todolistsActions.changeTodolistTitleAC({ id: id, title: title }))
    })
  }
}

export const todolistsSlice = slice.reducer
export const todolistsActions = slice.actions

export type FilterValuesType = "all" | "active" | "completed"
export type TodolistDomainType = TodolistType & {
  filter: FilterValuesType
  entityStatus: RequestStatusType
}
