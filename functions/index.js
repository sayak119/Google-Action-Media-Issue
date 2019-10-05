const name = 'I A Dev';

const introPrompt = 'This is a testing action.';

const data = [
  {
    "title": "On the Bach",
    "artist": "Jingle Punks",
    "album": "Cinematic",
    "source": "http://storage.googleapis.com/automotive-media/On_the_Bach.mp3",
    "image": "http://storage.googleapis.com/automotive-media/album_art.jpg"
  },
  {
    "title": "Drop and Roll",
    "artist": "Silent Partner",
    "album": "Youtube Audio Library Rock",
    "source": "http://storage.googleapis.com/automotive-media/Drop_and_Roll.mp3",
    "image": "http://storage.googleapis.com/automotive-media/album_art_2.jpg"
  },
  {
    "title": "Keys To The Kingdom",
    "artist": "The 126ers",
    "album": "Youtube Audio Library Rock 2",
    "source": "http://storage.googleapis.com/automotive-media/Keys_To_The_Kingdom.mp3",
    "image": "http://storage.googleapis.com/automotive-media/album_art_3.jpg"
  },
  {
    "title": "Awakening",
    "artist": "Silent Partner",
    "album": "Youtube Audio Library Rock",
    "source": "http://storage.googleapis.com/automotive-media/Awakening.mp3",
    "image": "http://storage.googleapis.com/automotive-media/album_art_2.jpg"
  }
];

const supportsMore = true;

'use strict';

const {dialogflow, Suggestions, MediaObject, Image} = require('actions-on-google');
const functions = require('firebase-functions');
const util = require('util');
const app = dialogflow({
  debug: true
});
app.middleware((conv, framework) => {
  console.log(`Intent=${conv.intent}`);
  console.log(`Type=${conv.input.type}`);
  conv.voice = conv.input.type === 'VOICE';
  if (!(conv.intent === 'Default Fallback Intent' || conv.intent === 'No-input')) {
    conv.data.fallbackCount = 0;
  }
});

const prompts = {
  'welcome': [
    `Welcome to ${name}.`,
    `Hi! It's time for ${name}.`
  ],
  'welcome_back': [
    `Welcome back to ${name}.`,
    `Hi again. Welcome back to ${name}.`
  ],
  'intro': [
    'Here we go.',
    `Let's get started.`
  ],
  'confirmation': [
    'Sure.',
    'OK.',
    'Okay.',
    'Sure thing.',
    'Alright.'
  ],
  'quit': [
    'Bye for now. Hope to see you soon.',
    'OK. Come back soon.',
    `Okay, let's try this again later.`,
    'OK. Hope to talk to you again soon.'
  ],
  'no_input1': [
    'Sorry, what was that?',
    `Sorry, I didn't hear that.`,
    `If you said something, I didn't hear it.`
  ],
  'no_input2': [
    `Sorry, I didn't catch that. Could you repeat yourself?`,
    `If you're still there, say that again.`
  ],
  'no_input3': [
    `Okay let's try this again later.`,
    'We can stop here. See you soon.'
  ],
  'fallback1': [
    `I didn't quite get that. What do you want to do?`,
    `I didn't understand that. What do you want to do?`
  ],
  'fallback2': [
    `Hmmm. Since I'm still having trouble, I'll stop here. Let's play again soon.`,
    `Since I'm still having trouble, I'll stop here. Try again in a few minutes.`,
    `Since I'm still having trouble, I'll stop here. Bye for now.`
  ],
  'help': [
    'You can ask to repeat the last track, go to the next track, or quit. What do you want to do?',
    'You can ask for the track to be repeated or you can ask for the next track. What do you want to do now?'
  ],
  'repeat': [
    'Here it is again: ',
    'Let me repeat that: '
  ],
  'error': [
    'Oops! Something went wrong. Please try again later.'
  ],
  'end': [
    'Hope to see you soon.',
    'Come back soon.',
    `Let's try this again later.`,
    'Hope to talk to you again soon.'
  ],
  'next': [
    `Next up: '%s' by '%s' from the album '%s'.`
  ]
};

if (introPrompt) {
  if (Array.isArray(introPrompt)) {
    prompts.intro = introPrompt;
  } else {
    prompts.intro = [introPrompt];
  }
}

const suggestions1 = new Suggestions('Next', 'Exit');
const suggestions2 = new Suggestions('Next', 'Previous', 'Exit');
const suggestions3 = new Suggestions('Exit');

const getRandomItem = (array) => {
  return array[Math.floor(Math.random() * (array.length))];
};

const getRandomPrompt = (conv, prompt) => {
  let availablePrompts = prompts[prompt];
  if (conv.data.prompts) {
    if (typeof (conv.data.prompts[prompt]) !== 'undefined') {
      availablePrompts = availablePrompts.filter(word => word !== conv.data.prompts[prompt]);
    }
  } else {
    conv.data.prompts = {};
  }
  if (availablePrompts.length > 0) {
    conv.data.prompts[prompt] = getRandomItem(availablePrompts);
  } else {
    conv.data.prompts[prompt] = prompts[prompt][0];
  }
  return conv.data.prompts[prompt];
};

const nextTrack = (conv, intro, backwards) => {
  console.log(`nextTrack: ${conv.user.storage.track}`);
  let track = data[0];
  if (conv.user.storage.track) {
    conv.user.storage.track = parseInt(conv.user.storage.track, 10);
    if (backwards) {
      conv.user.storage.track--;
    } else {
      conv.user.storage.track++;
    }
    if (conv.user.storage.track === 0) {
      conv.user.storage.track = data.length;
    } else if (conv.user.storage.track > data.length) {
      conv.user.storage.track = 1;
    }
    track = data[conv.user.storage.track - 1];
  } else {
    conv.user.storage.track = 1;
  }
  if (!intro) {
    const nextPrompt = util.format(getRandomPrompt(conv, 'next'), track.title, track.artist, track.album);
    if (conv.voice) {
      conv.ask(`<speak><prosody volume="silent">${nextPrompt}</prosody></speak>`);
    } else {
      conv.ask(nextPrompt);
    }
  }

  conv.ask(new MediaObject({
    name: track.title,
    url: track.source,
    description: track.artist,
    icon: new Image({
      url: track.image,
      alt: 'Media icon'
    })
  }));
  if (supportsMore) {
    conv.contexts.set('more', 5);
    conv.ask(conv.user.storage.track === 1 ? suggestions1 : suggestions2);
  } else {
    conv.ask(suggestions3);
  }
};

app.intent('Default Welcome Intent', (conv) => {
  console.log(`Welcome: ${conv.user.last.seen}`);
  if (!conv.surface.capabilities.has('actions.capability.MEDIA_RESPONSE_AUDIO')) {
    conv.close('Sorry, this device does not support audio playback.');
    return;
  }
  conv.ask(conv.user.last.seen ? getRandomItem(prompts.welcome_back) : getRandomItem(prompts.welcome));
  conv.ask(getRandomPrompt(conv, 'intro'));
  nextTrack(conv, true);
});

app.intent('Default Fallback Intent', (conv) => {
  console.log(`Fallback: fallbackCount=${conv.data.fallbackCount}`);
  console.log(`Fallback: raw=${conv.input.raw}`);
  conv.data.fallbackCount = parseInt(conv.data.fallbackCount, 10);
  conv.data.fallbackCount++;
  if (conv.data.fallbackCount === 1) {
    return conv.ask(getRandomPrompt(conv, 'fallback1'));
  }
  conv.close(getRandomPrompt(conv, 'fallback2'));
});

app.intent(['More', 'Yes', 'Next'], (conv) => {
  console.log(`More: fallbackCount=${conv.data.fallbackCount}`);
  nextTrack(conv, false);
});

app.intent(['Repeat', 'Previous'], (conv) => {
  console.log(`Repeat: ${conv.user.storage.track}`);
  nextTrack(conv, false, true);
});

app.intent(['No', 'Cancel', `Don't know`], (conv) => {
  conv.close(getRandomPrompt(conv, 'quit'));
});

app.intent('Help', (conv) => {
  conv.ask(`${getRandomPrompt(conv, 'help')}`);
});

app.intent('No-input', (conv) => {
  const repromptCount = parseInt(conv.arguments.get('REPROMPT_COUNT'));
  console.log(`No-input: repromptCount=${repromptCount}`);
  if (repromptCount === 0) {
    conv.ask(getRandomPrompt(conv, 'no_input1'));
  } else if (repromptCount === 1) {
    conv.ask(getRandomPrompt(conv, 'no_input2'));
  } else if (conv.arguments.get('IS_FINAL_REPROMPT')) {
    conv.close(getRandomPrompt(conv, 'no_input3'));
  }
});

app.intent('Media Status', (conv) => {
  const mediaStatus = conv.arguments.get('MEDIA_STATUS');
  if (mediaStatus && mediaStatus.status === 'FINISHED') {
    console.log(`track finished: ${conv.user.storage.track}`);
    if (supportsMore) {
      nextTrack(conv, false);
    } else {
      conv.close(getRandomPrompt(conv, 'end'));
    }
  } else {
    console.log('Unknown media status received.');
    conv.close(getRandomPrompt(conv, 'error'));
  }
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
