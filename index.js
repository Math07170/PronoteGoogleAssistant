const pronote = require('pronote-api');
const express = require('express')
const bodyParser = require('body-parser')

const expressApp = express().use(bodyParser.json())

const url = 'https://0070004s.index-education.net/pronote/eleve.html';
const username = 'ROBERT13';
const password = 'cornichon07';

const {dialogflow, Image, Permission} = require('actions-on-google');
const { response } = require('express');
const { stringify } = require('actions-on-google/dist/common');

const app = dialogflow();

app.intent('Default Welcome Intent', async(conv) => {
  if(typeof conv.user.storage.username !== 'undefined' && typeof conv.user.storage.password !== 'undefined' ){
    if(typeof conv.user.storage.name === 'undefined'){
      const session = await pronote.login(url, conv.user.storage.username, conv.user.storage.password/*, cas*/);
      conv.user.storage.name = session.user.name;
      session.logout()
    } 
    conv.ask("<speak>Bonjour, "+String(conv.user.storage.name).split(" ")[1]+" je suis l'assistant vocal pronote comment puis-je vous aider ?</speak>")
  }else{
    conv.ask("<speak>Vous n'êtes pas connecté dites 'Mon identifiant est' et 'Mon mot de passe est' pour vous connecté !</speak>")
  }
  
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
  session.logout()
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
    console.log(marks.subjects[0].marks);
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