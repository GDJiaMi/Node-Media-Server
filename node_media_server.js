//
//  Created by Mingliang Chen on 17/8/1.
//  illuspas[a]gmail.com
//  Copyright (c) 2018 Nodemedia. All rights reserved.
//

const Logger = require("./node_core_logger");
const NodeRtmpServer = require("./node_rtmp_server");
const NodeFlvSession = require("./node_flv_session");
const context = require("./node_core_ctx");
const Package = require("./package.json");

class NodeMediaServer {
  constructor(config) {
    this.config = config;
  }

  run() {
    Logger.setLogType(this.config.logType);
    Logger.log(`Node Media Server v${Package.version}`);
    // 接受 RTMP 推流
    if (this.config.rtmp) {
      this.nrs = new NodeRtmpServer(this.config);
      this.nrs.run();
    }

    process.on("uncaughtException", function(err) {
      Logger.error("uncaughtException", err);
    });
  }

  /**
   *
   * @param {string} name
   * @param {WritableStream} stream
   */
  connect(name, stream) {
    const session = new NodeFlvSession(
      this.config,
      {
        nmsConnectionType: "local",
        socket: {
          remoteAddress: "localstream"
        },
        method: 'GET',
        url: `http://localhost:8000${name}.flv`
      },
      stream
    );
    session.run();
  }

  on(eventName, listener) {
    context.nodeEvent.on(eventName, listener);
  }

  stop() {
    if (this.nrs) {
      this.nrs.stop();
    }
    if (this.nhs) {
      this.nhs.stop();
    }
    if (this.nls) {
      this.nls.stop();
    }
  }

  getSession(id) {
    return context.sessions.get(id);
  }
}

module.exports = NodeMediaServer;
