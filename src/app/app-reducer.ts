import { Dispatch } from "redux"
import { authAPI } from "api/todolists-api"
import { setIsLoggedInAC } from "features/Login/auth-reducer"
import { createSlice, PayloadAction } from "@reduxjs/toolkit"

const slice = createSlice({
  name: "app",
  initialState: {
    status: "idle" as RequestStatusType,
    error: null as string | null,
    isInitialized: false,
  },
  reducers: {
    setAppErrorAC: (state, action: PayloadAction<{ error: string | null }>) => {
      state.error = action.payload.error
    },
    setAppStatusAC: (state, action: PayloadAction<{ status: RequestStatusType }>) => {
      state.status = action.payload.status
    },
    setAppInitializedAC: (state, action: PayloadAction<{ isInitialized: boolean }>) => {
      state.isInitialized = action.payload.isInitialized
    },
  },
})

export const initializeAppTC = () => (dispatch: Dispatch) => {
  authAPI.me().then((res) => {
    if (res.data.resultCode === 0) {
      dispatch(setIsLoggedInAC({ isLoggedIn: true }))
    } else {
    }
    dispatch(appActions.setAppInitializedAC({ isInitialized: true }))
  })
}

export const appReducer = slice.reducer
export const appActions = slice.actions

export type InitialStateAppType = ReturnType<typeof slice.getInitialState>
export type RequestStatusType = "idle" | "loading" | "succeeded" | "failed"
