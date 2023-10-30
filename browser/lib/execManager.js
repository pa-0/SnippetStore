/**
 * private functions
 */
function _validateRunningInstancesExistence () {
  if (!ExecManager._runningInstances.has(this.processName)) {
    throw new Error('Something went wrong. Process instances are not set! Either you forget to call declareRun() for the execution process. (You need to do that before using some of the other API\'s).  Otherwise u did touch the internals while you should not! If not then that should be a bug.')
  }
}

function _addInstanceToProcessMap () {
  if (ExecManager._runningInstances.has(this.processName)) {
    ExecManager._runningInstances.get(this.processName).set(this.id, this)
    return this
  }
  ExecManager._runningInstances.set(this.processName, new Map([[this.id, this]]))
  return this
}

export class ExecManager {
  id
  processName
  shouldStop = false
  isRunning = false
  _state
  _stopPromise
  _resolvePromiseAtStop
  static _idSeed = 0
  static _runningInstances = new Map()

  constructor ({
    processName
  }) {
    this.processName = processName
    ExecManager._idSeed++
    this.id = ExecManager._idSeed
    this._stopPromise = new Promise((resolve) => {
      this._resolvePromiseAtStop = resolve
    })
  }

  /**
   * Return the promise of this instance to stop.
   * Will resolve once this instance finish the stop (once it call declareFinishedStop)
   * @returns Promise<void>
   */
  getStopPromise () {
    return this._stopPromise
  }

  getState () {
    return this._state
  }

  setState (newState) {
    this._state = newState
    return this
  }

  mergeState (state) {
    this._state = {
      ...this._state,
      ...state
    }
    return this
  }

  /**
   * Call this to signal that hte execution for this instance started running. Which would update the instance state.
   * And handle the internals and Subscribe the instance to the running instances of the process list
   * @returns this
   */
  declareRun () {
    this.isRunning = true
    _addInstanceToProcessMap.call(this)
    return this
  }

  /**
   * Call this to declare that this instance stopped
   * To be used after ur loop check the shouldStop state. And one u finish stopping the execution.
   * @returns this
   */
  declareFinished () {
    this.isRunning = false
    this._resolvePromiseAtStop()
    _validateRunningInstancesExistence.call(this)
    ExecManager._runningInstances.get(this.processName).delete(this.id)
    return this
  }

  /**
   * Call this function to trigger stopping the instances that are passed
   * @param {*} dontRejectIfOneFail
   * @returns Promise<any[]>
   */
  triggerStopInstances (instances, dontRejectIfOneFail) {
    const stopPromises = []

    for (const instance of instances) {
      instance.updateStateToShouldStop()
      stopPromises.push(instance.getStopPromise())
    }

    if (dontRejectIfOneFail) {
      return Promise.allSettled(stopPromises)
    }
    return Promise.all(stopPromises)
  }

  /**
   * Call this function to stop all already running instances of the same process type
   * @param {*} dontRejectIfOneFail
   * @returns Promise<any[]>
   */
  triggerStopAllOthers (dontRejectIfOneFail) {
    _validateRunningInstancesExistence.call(this)
    const runningInstancesClone = new Map(ExecManager._runningInstances.get(this.processName))
    runningInstancesClone.delete(this.id)

    return this.triggerStopInstances(
      runningInstancesClone.values(),
      dontRejectIfOneFail
    )
  }

  triggerStopWithMatch (matchCallback, dontRejectIfOneFail) {
    _validateRunningInstancesExistence.call(this)
    const instances = ExecManager._runningInstances.get(this.processName)
    const stopPromises = []

    instances.forEach(instance => {
      if (matchCallback(instance)) {
        instance.updateStateToShouldStop()
        stopPromises.push(instance.getStopPromise())
      }
    })

    if (dontRejectIfOneFail) {
      return Promise.allSettled(stopPromises)
    }
    return Promise.all(stopPromises)
  }

  updateStateToShouldStop () {
    this.shouldStop = true
  }
}
