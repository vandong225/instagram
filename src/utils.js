const { COMMENTS } = process.env;

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const formUrlEncoded = (x) =>
  Object.keys(x).reduce((p, c) => p + `&${c}=${encodeURIComponent(x[c])}`, "");

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const randomComment = () => {
  const comment = COMMENTS.split(",");
  const index = getRandomInt(0, comment.length);

  return comment[index];
};

module.exports = {
  sleep,
  formUrlEncoded,
  randomComment,
};
