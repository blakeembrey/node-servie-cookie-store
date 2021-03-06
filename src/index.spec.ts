import { Keysign } from "keysign";
import { Request, Response } from "servie/dist/node";
import { encode } from "universal-base64url";
import { Cookie } from "./index";

describe("servie cookie store", () => {
  const keys = new Keysign([Buffer.from("secret", "utf8")]);

  it("should work with regular cookies", () => {
    const req = new Request("/");
    const res = new Response(null);
    const cookie = new Cookie(req);

    req.headers.set("Cookie", `a=${cookie.encode(1)}; b=${cookie.encode(2)}`);

    expect(cookie.get("a")).toEqual(1);
    expect(cookie.get("b")).toEqual(2);
    expect(cookie.get("c")).toEqual(undefined);

    cookie.set(res, "a", { test: true });
    cookie.set(res, "b", "abc");

    expect(res.headers.asObject()).toMatchSnapshot();
  });

  it("should sign cookies", () => {
    const req = new Request("/");
    const cookie = new Cookie(req, keys);

    const res = new Response(null, {
      headers: {
        "Set-Cookie": [
          cookie.stringify("a", { test: true }),
          cookie.stringify("b", "abc")
        ]
      }
    });

    req.headers.set("Cookie", `a=${cookie.encode(1)}; b=${cookie.encode(2)}`);

    expect(cookie.get("a")).toEqual(1);
    expect(cookie.get("b")).toEqual(2);

    expect(res.headers.asObject()).toMatchSnapshot();
  });

  it("should ignore bad decodes", () => {
    const req = new Request("/");
    const cookie = new Cookie(req);

    req.headers.set("Cookie", `a=1; b=${cookie.encode(2)[0]}`);

    expect(cookie.get("a")).toBe(undefined);
    expect(cookie.get("b")).toBe(undefined);
  });

  it("should ignore tampered cookies", () => {
    const req = new Request("/");
    const cookie = new Cookie(req, keys);

    req.headers.set("Cookie", `a=${cookie.encode("test").slice(0, 36)}`);

    expect(cookie.get("a")).toBe(undefined);
  });

  it("should return undefined when parsing fails", () => {
    const req = new Request("/");
    const cookie = new Cookie(req);

    req.headers.set("Cookie", `a=${encode("aaaa")}`);

    expect(cookie.get("a")).toBe(undefined);
  });
  [undefined, null, "", 0, "test", { foo: true }].forEach(value => {
    it(`should encode and decode ${JSON.stringify(value)}`, () => {
      const req = new Request("/");
      const cookie = new Cookie(req);

      const encoded = cookie.encode(value);
      const decoded = cookie.decode(encoded);

      expect(encoded).toMatchSnapshot();
      expect(decoded).toEqual(value);
    });
  });

  it('should "delete" a cookie', () => {
    const req = new Request("/");
    const res = new Response(null);
    const cookie = new Cookie(req, keys);

    cookie.delete(res, "test");

    expect(res.headers.asObject()).toMatchSnapshot();
  });
});
