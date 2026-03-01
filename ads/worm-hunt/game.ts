import { createEngine } from "../../src/engine/core.js";
import { loadImage, createAtlas } from "../../src/engine/sprite.js";
import { createTutorialScene } from "./scenes/tutorial.js";
import { createGameplayScene } from "./scenes/gameplay.js";
import { createEndcardScene } from "./scenes/endcard.js";
import atlasData from "./assets/atlas.json";
import atlasUrl from "./assets/atlas.png";

async function main() {
  const engine = createEngine({
    width: 360,
    height: 640,
    ctaUrl:
      "https://play.google.com/store/apps/details?id=com.wildspike.wormhunt",
    maxDuration: 30,
  });

  const atlasImage = await loadImage(atlasUrl);
  const atlas = createAtlas(atlasImage, atlasData);

  engine.addScene("tutorial", createTutorialScene(engine, atlas));
  engine.addScene("gameplay", createGameplayScene(engine, atlas));
  engine.addScene("endcard", createEndcardScene(engine, atlas));

  engine.start("tutorial");
}

main();
