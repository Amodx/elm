<h1 align="center">
@amodx/elm
</h1>

---

```ts
import { ItemList } from "../../Components/ItemList/ItemList";
import { UIScreen } from "../UIScreen";
import "./Instructions.css";
import { UIScreensIds } from "../../../Game.types";
import { ElementChildren, elm, useRef } from "@amodx/elm";

const Screens: Record<string, () => ElementChildren> = {
  "Building Phase": () => {
    return elm(
      "div",
      "info",
      elm("h2", null, "Building Phase"),
      elm(
        "p",
        null,
        `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
occaecat cupidatat non proident, sunt in culpa qui officia deserunt
mollit anim id est laborum.`
      )
    );
  },
  "Guessing Phase": () => {
    return elm(
      "div",
      "info",
      elm("h2", null, "Guessing Phase"),
      elm(
        "p",
        null,
        `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
occaecat cupidatat non proident, sunt in culpa qui officia deserunt
mollit anim id est laborum.`
      )
    );
  },
  "Scoring Phase": () => {
    return elm(
      "div",
      "info",
      elm("h2", null, "Scoring Phase"),
      elm(
        "p",
        null,
        `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
occaecat cupidatat non proident, sunt in culpa qui officia deserunt
mollit anim id est laborum.`
      )
    );
  },
};

export default function () {
  const setChildren = (id: string) => {
    contentRightRef.current!.replaceChildren();
    elm.appendChildren(contentRightRef.current!, Screens[id]());
  };
  const contentRightRef = useRef<HTMLDivElement>(null);

  return elm(
    "div",
    {
      className: "instructions",
      hooks: {
        afterRender() {
          setChildren("Building Phase");
        },
      },
    },
    elm("div", "header", elm("p", "Instructions")),
    elm(
      "div",
      "body",
      elm(
        "div",
        "content",
        elm(
          "div",
          "content-left",
          ItemList({
            items: Object.keys(Screens).map((screen, index) => {
              return {
                actvie: index === 0,
                text: screen,
                onClick: () => setChildren(screen),
              };
            }),
          })
        ),
        elm("div", { className: "content-right", ref: contentRightRef })
      ),
      elm("div", "footer")
    )
  );
}

```




