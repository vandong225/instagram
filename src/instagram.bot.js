const puppeteer = require("puppeteer");
const fs = require("fs");
const axios = require("axios").default;
// const utils = require("./utils");

const { USER_NAME, PASSWORD, USER_ID } = process.env;

// axios.defaults.baseURL = "https://i.instagram.com/api/v1"
class InstagramBot {
  // _selectorDialog = 'div[role="dialog"] ._aano';
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
    await this.page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36"
    );

    await this.setUpInterceptor();
  };

  setUpInterceptor = async () => {
    await this.page.setRequestInterception(true);
    this.page.on('request', (request) => {
        if (['image'].indexOf(request.resourceType()) !== -1) {
            request.abort();
        } else {
            request.continue();
        }
    });

    await this.page.on('console', msg => {
        for (let i = 0; i < msg._args.length; ++i) {
            msg._args[i].jsonValue().then(result => {
                console.log(result);
            })
        }
    });
  }

  _writeCookie = async () => {
    const cookies = await this.page.cookies();
    await fs.writeFileSync("./cookies.json", JSON.stringify(cookies, null, 2));
  };

  _getCookie = () => {
    const cookiesString = fs.readFileSync("./cookies.json", "utf8");
    const cookie = JSON.parse(cookiesString);

    return cookie.map(({ name, value }) => `${name}=${value}`).join(";");
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
      await this._performLoginForm();
    }

    await this.page.goto(URL_PROFILE);
    await this.page.waitFor(5000);
    if (isLogin) await this._writeCookie();

    await this.page.screenshot({ path: "./images/example.png" });
  };

  closeBrowser = async () => {
    await this.browser.close();
  };

  // scrollDialog = async () => {
  //   const isDialogAppear = await this.page
  //     .waitForSelector("div[role=dialog]", {
  //       timeout: 5000,
  //     })
  //     .catch(console.log);

  //   if (isDialogAppear) {
  //     await this._autoScroll();
  //     const links = await this._getLinksProfile();
  //     console.log(links);
  //   }
  // };

  // _autoScroll = async () => {
  //   while (true) {
  //     const isBottom = await this.page.evaluate((selector) => {
  //       const element = document.querySelector(selector);
  //       const elementFollower = document.querySelector("._ac2a");
  //       const elementLinks = document.querySelectorAll(
  //         "div[role=dialog] a[role=link]"
  //       );
  //       const totalFollower = elementFollower.textContent;
  //       if (totalFollower == 0) return true;
  //       if (element) {
  //         element.scrollTop += element.offsetHeight;
  //         console.error(`Scrolled to selector ${selector}`);
  //       } else {
  //         console.error(`cannot find selector ${selector}`);
  //       }

  //       return totalFollower <= elementLinks.length;
  //     }, this._selectorDialog);

  //     if (isBottom) break;

  //     await utils.sleep(3000);
  //   }
  // };

  // _getLinksProfile = async () => {
  //   const links = await this.page.evaluate(() => {
  //     const elementLinks = document.querySelectorAll(
  //       "div[role=dialog] a[role=link]"
  //     );
  //     const res = [];
  //     for (const el of elementLinks) {
  //       res.push(el.href);
  //     }
  //     return res;
  //   }, this._selectorDialog);

  //   return links;
  // };

  getFollowers = async () => {
    // const links = await this.page.setRequestInterception
    console.log(
      this._getCookie(),
      `https://i.instagram.com/api/v1/friendships/${USER_ID}/followers/?count=12&search_surface=follow_list_page`
    );
    const res = await axios.get(
      `https://i.instagram.com/api/v1/friendships/${USER_ID}/followers/?count=12&search_surface=follow_list_page`,
      {
        headers: {
          "x-ig-app-id": 936619743392459,
          Cookies: this._getCookie(),
        },
      }
    );

    console.log(res.data.users);

  };

  buildBot = async () => {
    try {
      // await this.initialize();
      // await this.login();
      await this.getFollowers();
    } catch (e) {
      console.log(e);
    } finally {
      // await this.closeBrowser();
      console.log('finally')
    }
  };

  screenshot = async () => {
    await this.page.screenshot({ path: "./images/screenshot.png" });
  };
}

const instagram = new InstagramBot();

module.exports = instagram;
