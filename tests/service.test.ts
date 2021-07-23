import "chai-http";
import { expect, should } from "chai";
import UserModel from "../db/user.schema";
import LikeModel from "../db/like.schema";
import {
  awaitableDisconnect,
  initMongoDb,
  isMongoConnected,
} from "../db/mongo.db";
import { Exceptions } from "../services/types";
import { ExpectThrowsAsync } from "./ExpectThrowsAsync";

describe("Will test all services", () => {
  describe("Should test password service", async () => {
    const { default: passwordService } = await import(
      "../services/password.service"
    );
    before(async () => {
      if (!isMongoConnected()) {
        await initMongoDb();
      }
    });
    after(async () => {
      await awaitableDisconnect();
    });

    beforeEach(async () => {
      await UserModel.deleteMany({});
    });

    it("should generate different hash for same password", () => {
      const firstIteration = passwordService.getSaltAndPassword("mate");
      const secondIteration = passwordService.getSaltAndPassword("mate");
      should().not.equal(firstIteration.salt, secondIteration.salt);
      should().not.equal(
        firstIteration.hashedPassword,
        secondIteration.hashedPassword
      );
    });
    it("should generate same hash when salt and password are equal", () => {
      const salt = passwordService.getRandomSalt();
      const firstIteration = passwordService.getSaltAndPassword("mate", salt);
      const secondIteration = passwordService.getSaltAndPassword("mate", salt);
      should().equal(
        firstIteration.hashedPassword,
        secondIteration.hashedPassword
      );
    });
  });

  describe("Should test user service", async () => {
    const { default: userService } = await import("../services/user.service");

    it("Should create a user", async () => {
      const token = await userService.signUp("josip", "nikolić");
      expect(token).not.to.be.undefined;
      const user = await userService.getUser({ username: "josip" });
      should().equal(user.username, "josip");
    });

    it("Should prevent same username registration", async () => {
      await userService.signUp("josip", "nikolić");

      await ExpectThrowsAsync(
        () => userService.signUp("josip", "nikolić"),
        Exceptions.UserNameTakenException
      );
    });

    it("Should enable the user to login ", async () => {
      await userService.signUp("josip", "nikolić");
      const token = await userService.login("josip", "nikolić");
      expect(token).not.to.be.undefined;
    });

    it(`Should throw ${Exceptions.InvalidCredentialsException} if the user supplies wrong old password`, async () => {
      await userService.signUp("josip", "nikolić");
      await ExpectThrowsAsync(
        () =>
          userService.updatePassword("josip", "wrongOldPassword", "nikolić2"),
        Exceptions.InvalidCredentialsException
      );
    });

    it(`Should allow  the user to change password`, async () => {
      await userService.signUp("josip", "nikolić");
      const userBeforeUpdate = await userService.getUser({ username: "josip" });
      const userAfterUpdate = await userService.updatePassword(
        "josip",
        "nikolić",
        "nikolić2"
      );
      expect(userBeforeUpdate.password).not.to.equal(userAfterUpdate.password);
      expect(userBeforeUpdate.salt).not.to.equal(userAfterUpdate.salt);
    });

    async function Like() {
      await userService.signUp("UserWhoWillLike", "UserWhoWillLike");
      await userService.signUp("ToBeLiked", "ToBeLiked");

      let liker = await userService.getUser({ username: "UserWhoWillLike" });
      let toBeLiked = await userService.getUser({ username: "ToBeLiked" });

      await userService.like(liker._id, toBeLiked._id);
      await userService.like(liker._id, toBeLiked._id);

      liker = await userService.getUser({ username: "UserWhoWillLike" });
      expect(liker.liked.length).to.eq(1);
      expect(liker.likedBy.length).to.eq(0);

      toBeLiked = await userService.getUser({ username: "ToBeLiked" });
      expect(toBeLiked.liked.length).to.eq(0);
      expect(toBeLiked.likedBy.length).to.eq(1);

      await userService.signUp("ToBeLiked2", "ToBeLiked");
      toBeLiked = await userService.getUser({ username: "ToBeLiked2" });
      await userService.like(liker._id, toBeLiked._id);

      liker = await userService.getUser({ username: "UserWhoWillLike" });
      expect(liker.liked.length).to.eq(2);
      expect(liker.likedBy.length).to.eq(0);
    }
    it(`Should allow the user to like the other user`, async () => {
      await Like();
    });

    it(`Should allow the user to dislike the other user`, async () => {
      await Like();
      let liker = await userService.getUser({ username: "UserWhoWillLike" });
      let toDislike = await userService.getUser({ username: "ToBeLiked2" });
      await userService.unlike(liker._id, toDislike._id);
      liker = await userService.getUser({ username: "UserWhoWillLike" });
      toDislike = await userService.getUser({ username: "ToBeLiked2" });
      expect(liker.liked.length).to.eq(1);
      expect(toDislike.likedBy.length).to.eq(0);
    });

    it("Should retrieve an empty list of liked users", async () => {
      const result = await userService.getLikedUsers();
      expect(result).to.be.instanceOf(Array);
      expect(result.length).to.eq(0);
    });

    it("Should retrieve a list of users ordered by number of times a user has been liked", async () => {
      await Like();
      await userService.signUp("NewPlayer", "HasJoined");
      const liker = await userService.getUser({ username: "NewPlayer" });
      const toBeLiked = await userService.getUser({ username: "ToBeLiked" });
      await userService.like(liker._id, toBeLiked._id);
      const result = await userService.getLikedUsers();
      expect(result).to.be.instanceOf(Array);
      expect(result.length).to.eq(4);
      expect(result[0].username).to.eq("ToBeLiked");
    });
  });
});
