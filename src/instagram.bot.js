const puppeteer = require("puppeteer");
const fs = require("fs");

const { USER_NAME, PASSWORD } = process.env;
class InstagramBot {
  _selectorDialog = 'div[role="dialog"] ._aano';
  initialize = async () => {
    this.browser = await puppeteer.launch({
      headless: false,
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

  _performLoginForm = async () => {
    await this.page.type(
      '[aria-label="Phone number, username, or email"]',
      USER_NAME,
      { delay: 1000 }
    );
    await this.page.type('[aria-label="Password"]', PASSWORD, {
      delay: 1000,
    });
    await this.page.click("button[type = submit]", { delay: 1000 });

    await this.page.waitFor(10000);
  };

  login = async () => {
    const URL = "https://www.instagram.com/?hl=en";
    const URL_PROFILE = "https://www.instagram.com/khoi_troi/followers/?hl=en";
    await this.page.goto(URL);
    const isHaveCookie = await this._setCookie();
    if (isHaveCookie) {
      await this.page.reload();
    }
    await this.page.waitFor(5000);
    await this.page.screenshot({ path: "./images/navigation.png" });

    const inputUserName = await this.page
      .waitForSelector('[aria-label="Phone number, username, or email"]', {
        timeout: 5000,
      })
      .catch(console.log);

    const isLogin = inputUserName;

    if (isLogin) {
      this._performLoginForm();
    }

    await this.page.goto(URL_PROFILE);
    await this.page.waitFor(5000);
    if (isLogin) this._writeCookie();

    await this.page.screenshot({ path: "./images/example.png" });
  };

  closeBrowser = async () => {
    await this.browser.close();
  };

  scrollDialog = async () => {
    const isDialogAppear = await this.page
      .waitForSelector("div[role=dialog]", {
        timeout: 5000,
      })
      .catch(console.log);

    if (isDialogAppear) {
      await this._autoScroll();
      const links = await this._getLinksProfile();
      console.log(links);
    }
  };

  _autoScroll = async () => {
    while (true) {
      const isBottom = await this.page.evaluate((selector) => {
        const element = document.querySelector(selector);
        const elementFollower = document.querySelector("._ac2a");
        const elementLinks = document.querySelectorAll(
          "div[role=dialog] a[role=link]"
        );
        const totalFollower = elementFollower.textContent;
        if (totalFollower == 0) return true;
        if (element) {
          element.scrollTop += element.offsetHeight;
          console.error(`Scrolled to selector ${selector}`);
        } else {
          console.error(`cannot find selector ${selector}`);
        }

        return totalFollower <= elementLinks.length;
      }, this._selectorDialog);

      if (isBottom) break;

      await sleep(3000);
    }
  };

  _getLinksProfile = async () => {
    const links = await this.page.evaluate(() => {
      const elementLinks = document.querySelectorAll(
        "div[role=dialog] a[role=link]"
      );
      const res = [];
      for (const el of elementLinks) {
        res.push(el.href);
      }
      return res;
    }, this._selectorDialog);

    return links;
  };

  buildBot = async () => {
    try {
      await this.initialize();
      await this.login();
      await this.scrollDialog();
    } catch (e) {
      console.log(e);
    } finally {
      // await this.closeBrowser();
    }
  };

  screenshot = async () => {
    await this.page.screenshot({ path: "./images/screenshot.png" });
  };
}

const instagram = new InstagramBot();

module.exports = instagram;
