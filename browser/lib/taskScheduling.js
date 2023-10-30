export async function scheduleAsMacroTask (callback, timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(async () => {
      resolve(await callback())
    }, timeout)
  })
}

export async function scheduleAsMicroTask (callback) {
  return Promise.resolve().then(callback)
}

export async function scheduleAsCancelableMacroTask (execManager, callback, timeout = 0) {
  await scheduleAsMacroTask(async () => {
    if (execManager.shouldStop) {
      execManager.declareFinished()
      return
    }
    await callback()
  }, timeout)
}
