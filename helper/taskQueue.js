// taskQueue.js
class TaskQueue {
  constructor() {
    this.queue = Promise.resolve();
  }

  add(task) {
    this.queue = this.queue.then(() => task()).catch(err => {
      console.error('Task failed:', err);
    });
    return this.queue;
  }
}

module.exports = TaskQueue;
