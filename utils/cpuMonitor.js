const os = require("os");
const { exec } = require("child_process");

const INTERVAL = process.env.CPU_CHECK_INTERVAL_MS
  ? parseInt(process.env.CPU_CHECK_INTERVAL_MS)
  : 5000;
const THRESHOLD = process.env.CPU_RESTART_THRESHOLD
  ? parseInt(process.env.CPU_RESTART_THRESHOLD)
  : 70;
const REQUIRED_SAMPLES = process.env.CPU_CONSECUTIVE_SAMPLES
  ? parseInt(process.env.CPU_CONSECUTIVE_SAMPLES)
  : 3;

let aboveThresholdCount = 0;

function getCpuUsage() {
  return new Promise((resolve) => {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;

    cpus.forEach((core) => {
      for (type in core.times) {
        total += core.times[type];
      }
      idle += core.times.idle;
    });

    const idleDiff = idle;
    const totalDiff = total;

    const usage = (1 - idleDiff / totalDiff) * 100;
    resolve(usage.toFixed(2));
  });
}

function monitorCpu() {
  setInterval(async () => {
    const usage = await getCpuUsage();

    console.log(`CPU Usage: ${usage}%`);

    if (usage > THRESHOLD) {
      aboveThresholdCount++;
      if (aboveThresholdCount >= REQUIRED_SAMPLES) {
        console.log(
          `⚠️ CPU usage crossed ${THRESHOLD}% for ${REQUIRED_SAMPLES} checks. Restarting server...`
        );

        // Restart using PM2 if available
        if (process.env.USE_PM2 === "true") {
          exec("pm2 restart all", (err, stdout, stderr) => {
            if (err) console.error("PM2 restart failed:", err);
            console.log(stdout || stderr);
          });
        } else {
          process.exit(1);
        }
      }
    } else {
      aboveThresholdCount = 0; // reset if usage drops
    }
  }, INTERVAL);
}

module.exports = monitorCpu;
