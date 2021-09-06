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
import CarModel from "../db/car.schema";
import carRoute from "../routes/car.route";
if (process.env.NODE_ENV !== "test") {
  process.env.NODE_ENV = "test";
}
chai.use(chaiHttp);
const Helpers = {
  mainRoutes: {
    signUp: signUpRoute.path,
    logIn: loginRoute.path,
    car: carRoute.path,
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
  async deleteCar(requester: ChaiHttp.Agent, id: string, token?: string) {
    let request = requester.delete(`${Helpers.mainRoutes.car}/${id}`);
    if (token) {
      request = request.set({ Authorization: token });
    }
    return await request.send();
  },
  async createCar(requester: ChaiHttp.Agent, data: any, token?: string) {
    let request = requester.post(`${Helpers.mainRoutes.car}`);
    if (token) {
      request = request.set({ Authorization: token });
    }
    return await request.send({ ...data });
  },
  async getCars(
    requester: ChaiHttp.Agent,
    token?: string,
    urlParams?: URLSearchParams
  ) {
    let request = requester.get(`${Helpers.mainRoutes.car}?${urlParams}`);
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

  after(async () => await CarModel.deleteMany({}));

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
    expect(response.text).to.be.eq(
      Exceptions.UsernameOrPasswordIsEmptyException
    );

    response = await Helpers.createUser(_requester, "", "nikolić");
    expect(response.status).to.eq(500);
    expect(response.text).to.be.eq(
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

  it(`Should throw when not logged in`, async () => {
    const res = await Helpers.getCars(_requester);
    expect(res.status).to.equal(403);
    expect(res.text).to.equal(Exceptions.AuthorizationNotProvided);
  });

  it(`Should return 100 cars when sending no parameters`, async () => {
    await Helpers.createUser(_requester, "josip", "nikolić");
    const response = await Helpers.login(_requester, "josip", "nikolić");
    const token = response.body.token;
    const res = await Helpers.getCars(_requester, token);
    expect(res.body.length).to.equal(100);
  });

  it(`Should return Alfa romeo cars when sending make of Alfa`, async () => {
    await Helpers.createUser(_requester, "josip", "nikolić");
    const response = await Helpers.login(_requester, "josip", "nikolić");
    const token = response.body.token;
    const res = await Helpers.getCars(
      _requester,
      token,
      new URLSearchParams({ make: "Alfa" })
    );
    expect(res.body.length).to.equal(34);
  });

  it(`Should return 100 cars for year 2012`, async () => {
    await Helpers.createUser(_requester, "josip", "nikolić");
    const response = await Helpers.login(_requester, "josip", "nikolić");
    const token = response.body.token;
    const res = await Helpers.getCars(
      _requester,
      token,
      new URLSearchParams({ year: "2012" })
    );
    expect(res.body.length).to.equal(100);
  });

  it(`Should return Alfa romeo cars when sending make of Alfa romeo`, async () => {
    await Helpers.createUser(_requester, "josip", "nikolić");
    const response = await Helpers.login(_requester, "josip", "nikolić");
    const token = response.body.token;
    const res = await Helpers.getCars(
      _requester,
      token,
      new URLSearchParams({ make: "Alfa romeo" })
    );
    expect(res.body.length).to.equal(34);
  });

  it(`Should return 13 cars when sending year 2012 and make audi`, async () => {
    await Helpers.createUser(_requester, "josip", "nikolić");
    const response = await Helpers.login(_requester, "josip", "nikolić");
    const token = response.body.token;
    const res = await Helpers.getCars(
      _requester,
      token,
      new URLSearchParams({ make: "audi", year: "2012" })
    );
    expect(res.body.length).to.equal(13);
  });

  it(`Should return 25 cars when sending model A8`, async () => {
    await Helpers.createUser(_requester, "josip", "nikolić");
    const response = await Helpers.login(_requester, "josip", "nikolić");
    const token = response.body.token;
    const res = await Helpers.getCars(
      _requester,
      token,
      new URLSearchParams({ model: "A8" })
    );
    expect(res.body.length).to.equal(34);
  });

  it(`Should throw if not logged in and trying to delete`, async () => {
    const res = await Helpers.deleteCar(_requester, "123");
    expect(res.status).to.equal(403);
    expect(res.text).to.equal(Exceptions.AuthorizationNotProvided);
  });

  it(`Should throw if id does not exist`, async () => {
    await Helpers.createUser(_requester, "josip", "nikolić");
    const response = await Helpers.login(_requester, "josip", "nikolić");
    const token = response.body.token;
    const res = await Helpers.deleteCar(_requester, "123", token);
    expect(res.status).to.equal(400);
    expect(res.text).to.equal(Exceptions.InvalidIdProvidedException);
  });

  it(`Should succeed if id exists`, async () => {
    await Helpers.createUser(_requester, "josip", "nikolić");
    const response = await Helpers.login(_requester, "josip", "nikolić");
    const token = response.body.token;
    const result = await CarModel.find().limit(1);
    const res = await Helpers.deleteCar(
      _requester,
      result[0]._id.toString(),
      token
    );
    expect(res.status).to.equal(200);
  });

  it(`Should throw if not logged in and trying to create`, async () => {
    const res = await Helpers.createCar(_requester, {});
    expect(res.status).to.equal(403);
    expect(res.text).to.equal(Exceptions.AuthorizationNotProvided);
  });

  it(`Should throw if parameters are not supplied`, async () => {
    await Helpers.createUser(_requester, "josip", "nikolić");
    const response = await Helpers.login(_requester, "josip", "nikolić");
    const token = response.body.token;
    const res = await Helpers.createCar(_requester, {}, token);
    expect(res.status).to.equal(400);
    expect(res.text).to.equal(Exceptions.EmptyBodyNotAllowed);
  });

  it(`Should succeed if car details are provided`, async () => {
    await Helpers.createUser(_requester, "josip", "nikolić");
    const response = await Helpers.login(_requester, "josip", "nikolić");
    const token = response.body.token;
    const res = await Helpers.createCar(
      _requester,
      {
        make: "a",
        model: "a",
        year: 2020,
      },
      token
    );
    expect(res.status).to.equal(200);
  });

  it(`Should fail if same car details are supplied twice`, async () => {
    await Helpers.createUser(_requester, "josip", "nikolić");
    const response = await Helpers.login(_requester, "josip", "nikolić");
    const token = response.body.token;
    const res = await Helpers.createCar(
      _requester,
      {
        make: "a",
        model: "a",
        year: 2020,
      },
      token
    );
    expect(res.status).to.equal(400);
  });

  after(async () => {
    _requester.close();
    await closeAsync();
  });
});
