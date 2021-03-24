const pronote = require('pronote-api');
const express = require('express');
const bodyParser = require('body-parser');

const expressApp = express().use(bodyParser.json())

const url = 'https://0070004s.index-education.net/pronote/eleve.html';
const username = 'ROBERT13';
const password = 'cornichon07';

const {dialogflow, Image, Permission} = require('actions-on-google');
const { response } = require('express');
const { stringify } = require('actions-on-google/dist/common');

//Utils
function decodeEntities(encodedString) {
  var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
  var translate = {
      "nbsp":" ",
      "amp" : "&",
      "quot": "\"",
      "lt"  : "<",
      "gt"  : ">"
  };
  return encodedString.replace(translate_re, function(match, entity) {
      return translate[entity];
  }).replace(/&#(\d+);/gi, function(match, numStr) {
      var num = parseInt(numStr, 10);
      return String.fromCharCode(num);
  }).replace(/(<([^>]+)>)/gi, "");
}
const app = dialogflow();

//Welcome
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

//Connection
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

//Moyene Matière
app.intent('Moyenne Matiere', async (conv, args) => {
  const session = await pronote.login(url, conv.user.storage.username, conv.user.storage.password/*, cas*/);
  const marks = await session.marks();
  
  marks.subjects.forEach(subject => {
    console.log(args)
    console.log(subject.averages.student)
    if(subject.name === args.matieres){
      conv.ask("Vous avez " + String(subject.averages.student) + " sur 20 !");
      return;
    }
    conv.ask("Pas de notes saisies pour ce trimestre !")
  })
})

//Emploi du temps
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
    if(!lesson.isAway && !lesson.isCancelled){
      answer = answer + lesson.subject.toLowerCase().replace('&', 'et') + ", "
    }
  })
  answer = answer + "</speak>"
  conv.ask(answer)
  session.logout()
})

app.intent('Devoirs', async(conv, args)=>{
  reponse = "<speak>Vous avez :"
  const session = await pronote.login(url, conv.user.storage.username, conv.user.storage.password/*, cas*/);
  matiere = args.matieres
  if(typeof args['date-time'] !== 'undefined'){

    //Un jour
    if(typeof args['date-time'].length === "string"){
      date = new Date(args['date-time'])

      const works = await pronote.fetchHomeworks(session, pronote.toPronoteWeek(session, date))

      works.forEach((work) => {
        if(typeof matiere === 'string'){
          if(work.subject.name !== matiere) return;
        }
        if(work.for < dateFrom || work.for > dateTo) return;
        reponse = reponse +" En "+ work.subject.name.toLowerCase() +": "+  decodeEntities(work.description)
        console.log(reponse)
      })

    //Une période
    }else{
      dateFrom = new Date(args['date-time'].startDate)
      dateTo = new Date(args['date-time'].endDate)

      const works = await pronote.fetchHomeworks(session, pronote.toPronoteWeek(session, dateFrom), pronote.toPronoteWeek(session, dateTo))

      works.forEach((work) => {
        if(typeof matiere === 'string'){
          if(work.subject.name !== matiere) return;
        }
        if(work.for < dateFrom || work.for > dateTo) return;

        reponse = reponse +" En "+ work.subject.name.toLowerCase() +": "+  decodeEntities(work.description)
        console.log(work.description)
      })
    }
    
  }else{
    console.log("Else")
    const works = await pronote.fetchHomeworks(session, pronote.toPronoteWeek(new Date))
    works.forEach((work) => {
      if(typeof matiere === 'string'){
        if(work.subject.name !== matiere) return;
      }
      if(work.for < new Date()) return;
      reponse = reponse +" En "+ work.subject.name.toLowerCase() +": "+  decodeEntities(work.description)
    });
  }
  console.log(reponse)
  conv.ask(reponse + "</speak>")
})

expressApp.post('/', app)
expressApp.listen(process.env.PORT)



async function main()
{
    const session = await pronote.login(url, username, password/*, cas*/);
    
    
    console.log(session.user.name); // Affiche le nom de l'élève
    console.log(session.user.studentClass.name); // Affiche la classe de l'élève
    const devoirs = await pronote.fetchHomeworks(session, pronote.toPronoteWeek(session, new Date()), pronote.toPronoteWeek(session, new Date())+1);
    console.log(devoirs);
    devoirs.forEach(async(homeworks) => {
      description = decodeEntities(homeworks.description);
      console.log(description);
    });
    
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
