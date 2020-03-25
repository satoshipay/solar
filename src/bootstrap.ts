import SmoothScroll from "smoothscroll-polyfill"
import handleSplashScreen from "./SplashScreen/splash-screen"

import "threads/register"
import "./Workers/worker-controller"
import "./App/bootstrap"

SmoothScroll.polyfill()
handleSplashScreen()
