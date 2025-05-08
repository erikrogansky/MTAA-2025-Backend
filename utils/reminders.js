const { utcToZonedTime } = require("date-fns-tz");
const { prisma } = require('../db');
const { sendPushNotification } = require("../utils/firebaseHelper");
const cron = require('node-cron');

async function sendHydrationReminders() {
  const now = new Date();

  const reminders = await prisma.hydrationReminder.findMany({
    include: {
      user: {
        include: {
          devices: true,
        },
      },
    },
  });

  for (const reminder of reminders) {
    const localTime = utcToZonedTime(now, reminder.timezone);
    const hour = localTime.getHours();

    if (hour >= reminder.startHour && hour <= reminder.endHour) {
      const last = reminder.lastNotifiedAt ?? new Date(0);
      const hoursSinceLast = (now - last) / (1000 * 60 * 60);

      if (hoursSinceLast >= reminder.interval) {
        const tokens = reminder.user.devices
          .map(d => d.firebaseToken)
          .filter(Boolean);

        if (tokens.length > 0) {
          await sendPushNotification(tokens, "💧 Time to Hydrate!", "Stay fresh and drink some water!");
          
          await prisma.hydrationReminder.update({
            where: { id: reminder.id },
            data: { lastNotifiedAt: now },
          });

          console.log(`Hydration reminder sent to ${reminder.user.email}`);
        }
      }
    }
  }
}



function startHydrationCron() {
    cron.schedule('*/5 * * * *', () => {
        console.log("Running hydration reminder job...");
        sendHydrationReminders().catch(console.error);
    });
}
  
module.exports = { startHydrationCron };