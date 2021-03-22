const pronote = require('pronote-api');
const express = require('express')
const bodyParser = require('body-parser')

const expressApp = express().use(bodyParser.json())

const url = 'https://0070004s.index-education.net/pronote/eleve.html';
const username = 'ROBERT13';
const password = 'cornichon07';

const {dialogflow, Image} = require('actions-on-google');
const { response } = require('express');

const app = dialogflow();

app.intent('Default Welcome Intent', conv => {
  console.log(conv.user.storage.Test)
  conv.ask("Bonjour, je suis l'assistant vocal pronote comment puis-je vous aider ?")
})

app.intent('Login', (conv, args) => {
  if(args['username'] !== ''){
    conv.user.storage.username = args['username']
    conv.ask("Identifiant enregistré !")
  }else if(args['password'] !== ''){
    conv.user.storage.password = args['password']
    conv.ask("Mots de passe enregistré !")
  }
  else{
    conv.ask("Pas de donnée saisie veuillez réessayer")
  }
  
  
})
app.intent('Emploi du temps', async(conv, args)=>{
  const session = await pronote.login(url, conv.user.storage.username, conv.user.storage.password/*, cas*/);
  
  date = new Date(new Date(args['date-time']).toDateString());
  const timetable = await session.timetable(date)
  if(timetable.length === 0 ){
    conv.ask("Vous n'avez pas de cours aujourd'hui !");
    return;
  }
  conv.ask('Vous avez :')
  answer = "<speak>"
  timetable.forEach(lesson =>{
    if(!lesson.isAway || !lesson.isCancelled){
      answer = answer + lesson.subject.toLowerCase() + ", "
    }
  })
  answer = answer + "</speak>"
  conv.ask(answer)
})
expressApp.post('/', app)

expressApp.listen(process.env.PORT)

// Exemple


async function main()
{
    const session = await pronote.login(url, username, password/*, cas*/);
    
    console.log(session.user.name); // Affiche le nom de l'élève
    console.log(session.user.studentClass.name); // Affiche la classe de l'élève
    
    const timetable = await session.timetable(); // Récupérer l'emploi du temps d'aujourd'hui
    const marks = await session.marks(); // Récupérer les notes du trimestre
    console.log(`L'élève a ${timetable.length} cours aujourd'hui`); 
    console.log(timetable);
    timetable.forEach(function (cour){
        if(cour.isAway){
            console.log(cour.teacher + " est asent");
        }
    })
    console.log(session)
    console.log(process.env.PORT)
    
    // etc. les fonctions utilisables sont 'timetable', 'marks', 'contents', 'evaluations', 'absences', 
    // 'homeworks', 'infos', et 'menu', sans oublier les champs 'user' et 'params' qui regorgent d'informations.
}

main().catch(err => {
    if (err.code === pronote.errors.WRONG_CREDENTIALS.code) {
        console.error('Mauvais identifiants');    
    } else {
        console.error(err);
    }
});