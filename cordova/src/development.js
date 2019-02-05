function onDeviceReady() {
  if (navigator.connection.type == Connection.NONE) {
    navigator.notification.alert("An internet connection is required to continue")
  } else {
    window.location = "http://10.0.2.2:1234"
  }
}

document.addEventListener("deviceready", onDeviceReady, false)
