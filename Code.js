const ACCESS_TOKEN = CHANNEL_ACCESS_TOKEN;
const SECRET_KEY = API_KEY;
const MAX_TOKENS = 800;

function AI(prompt, temperature = 0.3, model = "text-davinci-003") {
  const url = "https://api.openai.com/v1/completions";
  const payload = {
    model: model,
    prompt: prompt,
    temperature: temperature,
    max_tokens: MAX_TOKENS,
  };
  const options = {
    contentType: "application/json",
    headers: { Authorization: "Bearer " + SECRET_KEY },
    payload: JSON.stringify(payload),
  };
  const res = JSON.parse(UrlFetchApp.fetch(url, options).getContentText());
  return res.choices[0].text.trim();
}


const bot = new LineBotSdk.client(ACCESS_TOKEN);

async function doPost(e) {
  await bot.call(e, callback);
}

async function callback(e) {
  const stringIn = e.message.text;
  const startsWithBot = stringIn.startsWith(".");
  const startsRiddle = stringIn.startsWith("/riddle");
  const userId = e.source.userId;
  
  if (startsWithBot && stringIn.length > 1) {
    const prompt = `yururu, ${stringIn.substring(1)}.`;
    const textResult = await AI(prompt);
    const response = `${textResult}`;
    await bot.replyMessage(e, [bot.textMessage(response)]);
  } else if (stringIn.toLowerCase().includes("yururu") || stringIn.toLowerCase().includes("ruru") || stringIn.toLowerCase().includes("yuru")) {
    const replacedText = stringIn.replace(/yururu|ruru|yuru/gi, "you/kamu");
    const prompt = `yururu, ${replacedText}.`;
    const textResult = await AI(prompt);
    const response = {
      type: "text",
      text: `${textResult}`,
      mentions: [{ type: "user", userId: `${userId}` }]
    };
    await bot.replyMessage(e, [response]);
  }


  

  else if (startsRiddle && stringIn.length > 8) {
    const answer = PropertiesService.getUserProperties().getProperty(userId); // retrieve the previous riddle's answer
    const riddle = PropertiesService.getUserProperties().getProperty(`${userId}_riddle`); // retrieve the previous riddle
    if (riddle) {
      await bot.replyMessage(e, [bot.textMessage(`There's already a riddle. use /current to see current riddle, answer with /r , not smart enough? you can /giveup`)]);
    } else {
      const theme = stringIn.substring(8);
      const prompt = `Generate random riddle with theme ${theme} without answer.`;
      const riddle = await AI(prompt);
      const answer = await AI(`the answer of ${riddle} is A: `);
      PropertiesService.getUserProperties().setProperty(userId, answer); // store the answer in Google Properties
      PropertiesService.getUserProperties().setProperty(`${userId}_riddle`, riddle); // store the riddle
      await bot.replyMessage(e, [bot.textMessage(riddle)]);
    }

  } else if (stringIn.startsWith("/r ") && e.message.type === "text") {
    const answer = PropertiesService.getUserProperties().getProperty(userId); // retrieve the previous riddle's answer 
    const userAnswer = stringIn.substring(3).trim();
    if (answer && answer.toLowerCase() === userAnswer.toLowerCase()) {
      await bot.replyMessage(e, [bot.textMessage("Congratulations, you got the answer right!")]);
      PropertiesService.getUserProperties().deleteProperty(userId); // delete the previous riddle's answer
      PropertiesService.getUserProperties().deleteProperty(`${userId}_riddle`); // delete the previous riddle
    } else {
      await bot.replyMessage(e, [bot.textMessage("Sorry, that is not the correct answer. Try again!")]);
    }
  } else if (stringIn === "/giveup") {
    const answer = PropertiesService.getUserProperties().getProperty(userId); // retrieve riddle's answer
    if (answer) {
      const riddle = PropertiesService.getUserProperties().getProperty(`${userId}_riddle`); // retrieve the previous riddle
      await bot.replyMessage(e, [bot.textMessage(`The answer is ${answer}. kek... can't answer such riddle?`)]);
      PropertiesService.getUserProperties().deleteProperty(userId); // delete answer
      PropertiesService.getUserProperties().deleteProperty(`${userId}_riddle`); // delete riddle
    } else {
      await bot.replyMessage(e, [bot.textMessage("There is no riddle to give up on.")]);
    }
  } else if (stringIn === "/current") {
    const riddle = PropertiesService.getUserProperties().getProperty(`${userId}_riddle`); // retrieve the current riddle
    if (riddle) {
      await bot.replyMessage(e, [bot.textMessage(`your current riddle: ${riddle}`)]);
    } else {
      await bot.replyMessage(e, [bot.textMessage("There is no riddle at the moment. Use /riddle to start a new one.")]);
    }
  }
}
