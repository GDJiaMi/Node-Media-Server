//
//  Created by Mingliang Chen on 17/8/1.
//  illuspas[a]gmail.com
//  Copyright (c) 2018 Nodemedia. All rights reserved.
//

const Http = require("http");
const Express = require("express");
const NodeFlvSession = require("./node_flv_session");
const HTTP_PORT = 80;
const Logger = require("./node_core_logger");
const context = require("./node_core_ctx");

class NodeHttpServer {
  constructor(config) {
    this.port = config.http.port || HTTP_PORT;
    this.config = config;

    let app = Express();

    app.all("*", (req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type,Content-Length, Authorization, Accept,X-Requested-With"
      );
      res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
      res.header("Access-Control-Allow-Credentials", true);
      req.method === "OPTIONS" ? res.sendStatus(200) : next();
    });

    // 获取流
    app.get("*.flv", (req, res, next) => {
      req.nmsConnectionType = "http";
      this.onConnect(req, res);
    });

    this.httpServer = Http.createServer(app);
  }

  run() {
    this.httpServer.listen(this.port, () => {
      Logger.log(`Node Media Http Server started on port: ${this.port}`);
    });

    this.httpServer.on("error", e => {
      Logger.error(`Node Media Http Server ${e}`);
    });

    this.httpServer.on("close", () => {
      Logger.log("Node Media Http Server Close.");
    });

    context.nodeEvent.on("postPlay", (id, args) => {
      context.stat.accepted++;
    });

    context.nodeEvent.on("postPublish", (id, args) => {
      context.stat.accepted++;
    });

    context.nodeEvent.on("doneConnect", (id, args) => {
      let session = context.sessions.get(id);
      let socket =
        session instanceof NodeFlvSession ? session.req.socket : session.socket;
      context.stat.inbytes += socket.bytesRead;
      context.stat.outbytes += socket.bytesWritten;
    });
  }

  stop() {
    this.httpServer.close();

    context.sessions.forEach((session, id) => {
      if (session instanceof NodeFlvSession) {
        session.req.destroy();
        context.sessions.delete(id);
      }
    });
  }

  onConnect(req, res) {
    let session = new NodeFlvSession(this.config, req, res);
    session.run();
  }
}

module.exports = NodeHttpServer;
