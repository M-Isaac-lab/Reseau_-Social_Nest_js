import { Injectable } from '@nestjs/common';
import * as nodemailer from "nodemailer"

@Injectable()
export class MailerService {

  private async transporteur () {
    const testAccount = await nodemailer.createTestAccount()
    const transport = nodemailer.createTransport({
      host : "localhost",
      port : 1025,
      ignoreTLS : true,
      auth : {
        user : testAccount.user,
        pass : testAccount.pass
      }
    })

    return transport

  }

  async sendSignupConfirmation (userEmail : string) {
    (await this.transporteur()).sendMail({
      from : "app@localhost.com",
      to : userEmail,
      subject : "Inscription",
      html : "<h1>Confirmation d'inscription</h1>"
    })
  }

  async resetPasswordConfirmation(userEmail: string, code : string, url : string) {
    (await this.transporteur()).sendMail({
      from : "app@localhost.com",
      to : userEmail,
      subject : "Reset password",
      html : "<h1>Voici le code reinitialisation du mot de passe</h1>" +
        `<i>Voici le code <span> ${code} </span></i>`+
        `<a href=${url}> Cliquez ici pour continuer</a>`
    })
  }

  async DeleteAccountConfirmation(userEmail: string, code : string, url : string) {
    (await this.transporteur()).sendMail({
      from : "app@localhost.com",
      to : userEmail,
      subject : "Delete Accounte",
      html : "<h1>Voici le code supprimer le compte</h1>" +
        `<i>Voici le code <span> ${code} </span></i>`+
        `<a href=${url}> Cliquez ici pour continuer</a>`
    })
  }
}
