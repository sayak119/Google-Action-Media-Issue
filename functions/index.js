'use strict';

const {
  dialogflow,
  SimpleResponse,
  Image,
  Suggestions,
  MediaObject,
} = require('actions-on-google');
const functions = require('firebase-functions');

const app = dialogflow({debug: true});

app.intent('Media Response', (conv) => {
  if (!conv.surface.capabilities
    .has('actions.capability.MEDIA_RESPONSE_AUDIO')) {
      conv.ask('Sorry, this device does not support audio playback.');
      conv.ask('Which response would you like to see next?');
      return;
  }

  conv.ask('This is a media response example.');
  conv.ask(new MediaObject({
    name: 'Jazz in Paris',
    url: 'https://storage.googleapis.com/automotive-media/Jazz_In_Paris.mp3',
    description: 'A funky Jazz tune',
    icon: new Image({
      url: 'https://storage.googleapis.com/automotive-media/album_art.jpg',
      alt: 'Album cover of an ocean view',
    }),
  }));
  conv.ask(new Suggestions(['cancel']));
});

app.intent('Media Status', (conv) => {
  const mediaStatus = conv.arguments.get('MEDIA_STATUS');
  let response = 'Unknown media status received.';
  if (mediaStatus && mediaStatus.status === 'FINISHED') {
    conv.ask('Here is the next song');
    conv.ask(new MediaObject({
      name: 'On the Bach',
      url: 'http://storage.googleapis.com/automotive-media/On_the_Bach.mp3',
      description: 'Jingle Punks',
      icon: new Image({
        url: 'http://storage.googleapis.com/automotive-media/album_art_2.jpg',
        alt: 'Cinematic',
      }),
    }));
  } else {
    response = 'Hope you enjoyed the tune! ';
    conv.ask(response);
    conv.ask('Media ended successfully');
  }
  conv.ask(new Suggestions(['exit']));
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
