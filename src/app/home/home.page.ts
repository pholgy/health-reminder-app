import { Component } from '@angular/core';
import { ToastController, AlertController } from '@ionic/angular';
import { LocalNotifications } from '@capacitor/local-notifications'; // Import Local Notifications

enum ReminderType {
  MEDICATION = 'Medication',
  APPOINTMENT = 'Appointment',
  GENERAL = 'General',
}

interface Reminder {
  id: string;
  time: string;
  text: string;
  type: ReminderType;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  newReminder: Reminder = {
    id: '',
    time: '',
    text: '',
    type: ReminderType.MEDICATION
  };

  reminderTypes = Object.values(ReminderType);
  reminders: Reminder[] = [];

  constructor(
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    this.loadReminders();
  }

  // Load reminders from localStorage when the component is created
  loadReminders() {
    const storedReminders = localStorage.getItem('reminders');
    if (storedReminders) {
      this.reminders = JSON.parse(storedReminders);
    }
  }

  // Save reminders to localStorage
  saveReminders() {
    localStorage.setItem('reminders', JSON.stringify(this.reminders));
  }

  // Add new reminder and schedule notification
  addReminder() {
    if (this.newReminder.time && this.newReminder.text) {
      const reminder = {
        ...this.newReminder,
        id: Date.now().toString() // Generate a unique ID
      };
      this.reminders.push(reminder);
      this.saveReminders();
      this.scheduleNotification(reminder); // Schedule notification
      this.presentToast('Reminder added successfully');
      this.resetForm();
    }
  }

  // Reset form fields
  resetForm() {
    this.newReminder = {
      id: '',
      time: '',
      text: '',
      type: ReminderType.MEDICATION
    };
  }

  // Present a toast message
  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }

  // Delete a reminder
  deleteReminder(id: string) {
    this.reminders = this.reminders.filter(r => r.id !== id);
    this.saveReminders();
  }

  // Edit a reminder
  async editReminder(reminder: Reminder) {
    const alert = await this.alertController.create({
      header: 'Edit Reminder',
      inputs: [
        {
          name: 'time',
          type: 'time',
          value: reminder.time,
          placeholder: 'Time'
        },
        {
          name: 'text',
          type: 'text',
          value: reminder.text,
          placeholder: 'Reminder Text'
        },
        // Using radio buttons for the reminder type selection
        {
          name: 'type',
          type: 'radio',
          label: 'Reminder Type',
          value: reminder.type
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save',
          handler: (data) => {
            const index = this.reminders.findIndex(r => r.id === reminder.id);
            if (index !== -1) {
              this.reminders[index] = { ...reminder, ...data };
              this.saveReminders();
              this.presentToast('Reminder updated successfully');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Simulate notification for testing
  async simulateNotification(reminder: Reminder) {
    const alert = await this.alertController.create({
      header: `${reminder.type} Reminder`,
      message: `${reminder.text} (${reminder.time})`,
      buttons: ['OK']
    });

    await alert.present();
  }

  // Schedule a notification for the reminder's time
  async scheduleNotification(reminder: Reminder) {
    const timeParts = reminder.time.split(':');
    const now = new Date();
    const notificationTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      +timeParts[0],
      +timeParts[1]
    );

    await LocalNotifications.schedule({
      notifications: [
        {
          title: `${reminder.type} Reminder`,
          body: `${reminder.text}`,
          id: parseInt(reminder.id),
          schedule: { at: notificationTime },
          smallIcon: 'ic_launcher',
          iconColor: '#488AFF'
        }
      ]
    });
  }

  // Method to get different icons for each type
  getIconForType(reminderType: string): string {
    switch (reminderType) {
      case 'Medication':
        return 'medkit-outline'; // Icon for Medication
      case 'Appointment':
        return 'calendar-outline'; // Icon for Appointment
      case 'General':
        return 'information-circle-outline'; // Icon for General reminder
      default:
        return 'book-outline'; // Default icon
    }
  }
}
