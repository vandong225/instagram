const puppeteer = require("puppeteer");
const fs = require("fs");

const { USER_NAME, PASSWORD } = process.env;

// let browser;
// let page = puppeteer.Page;

// (async () => {
//   browser = await puppeteer.launch({
//     headless: true,
//     args: [
//       "--disable-gpu",
//       "--disable-dev-shm-usage",
//       "--disable-setuid-sandbox",
//       "--no-sandbox",
//     ],
//   });
//   page = await browser.newPage();
// })();

class InstagramBot {
  initialize = async () => {
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--no-sandbox",
      ],
    });
    this.page = await this.browser.newPage();
  };

  _writeCookie = async () => {
    const cookies = await this.page.cookies();
    await fs.writeFileSync("./cookies.json", JSON.stringify(cookies, null, 2));
  };

  _setCookie = async () => {
    try {
      const cookiesString = await fs.readFileSync("./cookies.json");
      if (!cookiesString) return false;
      const cookies = JSON.parse(cookiesString);
      await this.page.setCookie(...cookies);

      return true;
    } catch (e) {
      return false;
    }
  };

  login = async () => {
    await this.page.goto("https://www.instagram.com/?hl=en");
    const isHaveCookie = await this._setCookie();
    console.log(isHaveCookie);
    if (isHaveCookie) {
      await this.page.goto("https://www.instagram.com/?hl=en");
    }

    await this.page.waitFor(5000);
    await this.page.screenshot({ path: "navigation.png" });

    const inputUserName = await this.page.waitForSelector(
      '[aria-label="Phone number, username, or email"]',
      {
        timeout: 5000,
      }
    );
    const isLogin = inputUserName;

    if (isLogin) {
      await this.page.type(
        '[aria-label="Phone number, username, or email"]',
        USER_NAME,
        { delay: 1000 }
      );
      await this.page.type('[aria-label="Password"]', PASSWORD, {
        delay: 1000,
      });
      await this.page.click("button[type = submit]", { delay: 1000 });

      this._writeCookie();
    }
    await this.page.waitFor(5000);

    await this.page.screenshot({ path: "example.png" });
  };

  closeBrowser = async () => {
    await this.browser.close();
  };

  buildBot = async () => {
    try {
      await this.initialize();
      await this.login();
    } catch (e) {
      console.log(e);
    } finally {
      await this.closeBrowser();
    }
  };
}

const instagram = new InstagramBot();

module.exports = instagram;
