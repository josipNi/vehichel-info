import { Express } from "express";
import { Server } from "http";
import * as chai from "chai";
import { startAsync, closeAsync } from "../server";
import getEnvironmentConfig from "../config";
import { AddressInfo } from "net";
import "chai-http";
import { JsonWebTokenError, verify } from "jsonwebtoken";
import { expect, should } from "chai";
import chaiHttp = require("chai-http");
import { Exceptions, IUser } from "../services/types";
import UserModel from "../db/user.schema";
import signUpRoute from "../routes/sign-up.route";
import loginRoute from "../routes/login.route";
import meRoute from "../routes/me.route";
import mostLikedRoute from "../routes/most-liked.route";
if (process.env.NODE_ENV !== "test") {
  process.env.NODE_ENV = "test";
}
chai.use(chaiHttp);
const Helpers = {
  mainRoutes: {
    signUp: signUpRoute.path,
    logIn: loginRoute.path,
    me: meRoute.path,
    mostLiked: mostLikedRoute.path,
  },
  async createUser(
    requester: ChaiHttp.Agent,
    username: string,
    password: string
  ) {
    return await requester
      .post(Helpers.mainRoutes.signUp)
      .send({ username, password });
  },
  async login(requester: ChaiHttp.Agent, username: string, password: string) {
    return await requester
      .post(Helpers.mainRoutes.logIn)
      .send({ username, password });
  },

  async getMe(requester: ChaiHttp.Agent, token?: string) {
    let request = requester.get(Helpers.mainRoutes.me);
    if (token) {
      request = request.set({ Authorization: token });
    }
    return await request.send();
  },
};
describe("Will test all server endpoints", () => {
  let _server: Server, _expressServer: Express;
  let _requester: ChaiHttp.Agent;

  before(async () => {
    const { server, expressServer } = await startAsync();
    _requester = chai.request(server).keepOpen();
    _server = server;
    _expressServer = expressServer;
  });
  beforeEach(async () => {
    await UserModel.deleteMany({});
  });

  it("Server should start and have NODE_ENV set to test", () => {
    expect(_server).exist;
    should().not.equal(_server, undefined);
    const config = getEnvironmentConfig();
    expect(config.isEnvironment("test")).to.be.true;
    const address = _server.address() as AddressInfo;
    should().equal(address.port, config.server.port);
  });

  it("Should allow you to sign up", async () => {
    const response = await Helpers.createUser(_requester, "josip", "nikolić");
    expect(response.status).to.eq(200);
    expect(response.body).to.haveOwnProperty("token");
    expect(response.body.token).to.not.be.undefined;
  });

  it(`Should return 500 / ${Exceptions.UsernameOrPasswordIsEmptyException} if you send empty username or password`, async () => {
    let response = await Helpers.createUser(_requester, "josip", "");
    expect(response.status).to.eq(500);
    expect(response.body).to.be.eq(
      Exceptions.UsernameOrPasswordIsEmptyException
    );

    response = await Helpers.createUser(_requester, "", "nikolić");
    expect(response.status).to.eq(500);
    expect(response.body).to.be.eq(
      Exceptions.UsernameOrPasswordIsEmptyException
    );
  });

  it("Should allow you to log in and return a JWT token", async () => {
    await Helpers.createUser(_requester, "josip", "nikolić");
    const response = await Helpers.login(_requester, "josip", "nikolić");
    expect(response.status).to.eq(200);
    expect(response.body).to.haveOwnProperty("token");
    expect(response.body.token).to.not.be.undefined;

    const { jwt } = getEnvironmentConfig();
    const verifiedJwt = verify(
      response.body.token,
      jwt.secretOrPrivateKey
    ) as IUser;

    expect(verifiedJwt).to.haveOwnProperty("userId");
    expect(verifiedJwt).to.haveOwnProperty("username");
    should().equal(verifiedJwt.username, "josip");
  });

  it("Should throw if jwt has been tempered with", async () => {
    await Helpers.createUser(_requester, "josip", "nikolić");
    const response = await Helpers.login(_requester, "josip", "nikolić");

    const { jwt } = getEnvironmentConfig();
    response.body.token += "a";
    try {
      verify(response.body.token, jwt.secretOrPrivateKey);
    } catch (err) {
      expect(err).to.be.instanceOf(JsonWebTokenError);
    }
  });

  it(`Should return 403 / ${Exceptions.AuthorizationNotProvided} for unauthorized user`, async () => {
    const response = await Helpers.getMe(_requester);
    expect(response.status).to.eq(403);
    expect(response.body).to.eq(Exceptions.AuthorizationNotProvided);
  });

  it("Should return logged in user information", async () => {
    await Helpers.createUser(_requester, "test", "test");

    let response = await Helpers.login(_requester, "test", "test");
    const token = response.body.token;

    response = await Helpers.getMe(_requester, token);
    expect(response.status).to.eq(200);
    expect(response.body).to.haveOwnProperty("username");
    expect(response.body.username).to.equal("test");
  });

  it(`Should return 403 / ${Exceptions.TokenVerificationFailed}`, async () => {
    const response = await Helpers.getMe(_requester, "BadAuthorizationAttempt");
    expect(response.status).to.eq(403);
    expect(response.body).to.eq(Exceptions.TokenVerificationFailed);
  });

  it(`Should return 403 / ${Exceptions.TokenVerificationFailed}when token is tempered with`, async () => {
    await Helpers.createUser(_requester, "Mr.", "Hacker");

    let response = await Helpers.login(_requester, "Mr.", "Hacker");
    const token = response.body.token;
    response = await Helpers.getMe(_requester, `${token[0]}${token}`);

    expect(response.status).to.eq(403);
    expect(response.body).to.eq(Exceptions.TokenVerificationFailed);
  });

  it(`Should allow the logged in user to update his password when he supplies the correct old password`, async () => {
    await Helpers.createUser(_requester, "Mr.", "Hacker");
    let response = await Helpers.login(_requester, "Mr.", "Hacker");
    const token = response.body.token;
    response = await _requester
      .post("/me/update-password")
      .set({ Authorization: token })
      .send({ oldPassword: "Hacker", newPassword: "PacMan" });

    expect(response.status).to.eq(200);
    expect(response.body).to.eq(true);
  });

  it(`Should return 403 / ${Exceptions.TokenVerificationFailed} when not logged in and trying to change password`, async () => {
    const response = await _requester
      .post("/me/update-password")
      .set({ Authorization: "BadAuthorizationAttempt" })
      .send();
    expect(response.status).to.eq(403);
    expect(response.body).to.eq(Exceptions.TokenVerificationFailed);
  });

  it(`Should return 500 / ${Exceptions.TokenVerificationFailed} when not logged in and not supplying request body`, async () => {
    await Helpers.createUser(_requester, "Mr.", "Hacker");
    let response = await Helpers.login(_requester, "Mr.", "Hacker");
    const token = response.body.token;
    response = await _requester
      .post("/me/update-password")
      .set({ Authorization: token })
      .send();
    expect(response.status).to.eq(500);
  });

  it(`Should return users likes and his id`, async () => {
    await Helpers.createUser(_requester, "Mr.", "Hacker");
    let response = await Helpers.login(_requester, "Mr.", "Hacker");

    const token = response.body.token;
    response = await Helpers.getMe(_requester, token);
    const userId = response.body.userId;
    response = await _requester.get(`/user/${userId}`).send();
    expect(response.status).to.eq(200);
    expect(response.body).to.haveOwnProperty("id");
    expect(response.body).to.haveOwnProperty("liked");
    expect(response.body).to.haveOwnProperty("likedBy");
    expect(response.body.id).to.eq(userId);
    expect(response.body.liked).to.eq(0);
    expect(response.body.likedBy).to.eq(0);
  });

  it(`Should throw when id is not found`, async () => {
    const response = await _requester.get(`/user/gibberish`).send();
    expect(response.status).to.eq(404);
    expect(response.body).to.eq(Exceptions.UserNotFoundException);
  });

  it(`Should return 403 / ${Exceptions.AuthorizationNotProvided} when liking as an unauthorized user`, async () => {
    const response = await _requester.post("/user/does-not-matter/like").send();
    expect(response.status).to.eq(403);
    expect(response.body).to.eq(Exceptions.AuthorizationNotProvided);
  });

  it(`Should return 403 / ${Exceptions.AuthorizationNotProvided} when disliking as an unauthorized user`, async () => {
    const response = await _requester
      .post("/user/does-not-matter/unlike")
      .send();
    expect(response.status).to.eq(403);
    expect(response.body).to.eq(Exceptions.AuthorizationNotProvided);
  });

  it(`Should return 404 / ${Exceptions.UserNotFoundException} when liking a non existing user`, async () => {
    await Helpers.createUser(_requester, "Sir", "Likable");
    let response = await Helpers.login(_requester, "Sir", "Likable");
    response = await _requester
      .post("/user/does-not-matter/like")
      .set({ Authorization: response.body.token })
      .send();
    expect(response.status).to.eq(404);
    expect(response.body).to.eq(Exceptions.UserNotFoundException);
  });

  it(`Should return 404 / ${Exceptions.UserNotFoundException} when disliking a non existing user`, async () => {
    await Helpers.createUser(_requester, "Sir", "Likable");
    let response = await Helpers.login(_requester, "Sir", "Likable");
    response = await _requester
      .post("/user/does-not-matter/unlike")
      .set({ Authorization: response.body.token })
      .send();
    expect(response.status).to.eq(404);
    expect(response.body).to.eq(Exceptions.UserNotFoundException);
  });

  it(`Should increase the number of liked of a user`, async () => {
    await Like();
  });

  async function Like() {
    await Helpers.createUser(_requester, "Sir", "Likable");
    await Helpers.createUser(_requester, "Mr.", "Mot");

    let userToBeLiked = await Helpers.login(_requester, "Mr.", "Mot");
    const tokenOfTheLikedUser = userToBeLiked.body.token;
    userToBeLiked = await Helpers.getMe(_requester, tokenOfTheLikedUser);
    const idOfTheUserToBeLiked = userToBeLiked.body.userId;

    let loggedInUser = await Helpers.login(_requester, "Sir", "Likable");
    const loggedInUserToken = loggedInUser.body.token;
    loggedInUser = await Helpers.getMe(_requester, loggedInUserToken);
    const idOfTheLoggedInUser = loggedInUser.body.userId;
    loggedInUser = await _requester
      .post(`/user/${idOfTheUserToBeLiked}/like`)
      .set({ Authorization: loggedInUserToken })
      .send();
    expect(loggedInUser.status).to.eq(200);
    expect(loggedInUser.body).to.eq(true);

    userToBeLiked = await _requester
      .get(`/user/${idOfTheUserToBeLiked}`)
      .set({ Authorization: tokenOfTheLikedUser })
      .send();
    expect(userToBeLiked.status).to.eq(200);
    expect(userToBeLiked.body.liked).to.eq(0);
    expect(userToBeLiked.body.likedBy).to.eq(1);

    loggedInUser = await _requester
      .get(`/user/${idOfTheLoggedInUser}`)
      .set({ Authorization: loggedInUserToken })
      .send();
    expect(loggedInUser.status).to.eq(200);
    expect(loggedInUser.body.liked).to.eq(1);
    expect(loggedInUser.body.likedBy).to.eq(0);
  }

  it(`Should decrease the number of likes of a user`, async () => {
    await Helpers.createUser(_requester, "Sir", "LikeALot");
    await Helpers.createUser(_requester, "Hater", "OfLikes");
    const {
      body: { token: likeableToken },
    } = await Helpers.login(_requester, "Sir", "LikeALot");
    const {
      body: { userId: likeableId },
    } = await Helpers.getMe(_requester, likeableToken);
    const {
      body: { token: haterToken },
    } = await Helpers.login(_requester, "Hater", "OfLikes");
    const {
      body: { userId: haterId },
    } = await Helpers.getMe(_requester, haterToken);
    await _requester
      .post(`/user/${likeableId}/like`)
      .set({ Authorization: haterToken })
      .send();
    let response = await _requester
      .post(`/user/${haterId}/like`)
      .set({ Authorization: likeableToken })
      .send();
    response = await _requester
      .post(`/user/${likeableId}/unlike`)
      .set({ Authorization: haterToken })
      .send();

    const sirLikeALot = await _requester.get(`/user/${likeableId}`);
    expect(sirLikeALot.status).to.eq(200);
    expect(sirLikeALot.body.liked).to.eq(1);
    expect(sirLikeALot.body.likedBy).to.eq(0);
    const haterOfLikes = await _requester.get(`/user/${haterId}`);
    expect(haterOfLikes.status).to.eq(200);
    expect(haterOfLikes.body.liked).to.eq(0);
    expect(haterOfLikes.body.likedBy).to.eq(1);
  });

  it(`Should return an empty array`, async () => {
    const response = await _requester.get(Helpers.mainRoutes.mostLiked);
    expect(response.status).to.eq(200);
    expect(response.body).to.be.instanceOf(Array);
    expect(response.body).to.be.empty;
  });

  it(`Should return an array of liked users`, async () => {
    await Like();
    const response = await _requester.get(Helpers.mainRoutes.mostLiked);
    expect(response.status).to.eq(200);
    expect(response.body).to.be.instanceOf(Array);
    expect(response.body.length).to.eq(2);
    expect(response.body[0].username).to.eq("Mr.");
    expect(response.body[0].likedBySize).to.eq(1);
  });

  after(async () => {
    _requester.close();
    await closeAsync();
  });
});
