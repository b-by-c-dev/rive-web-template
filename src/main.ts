import { Rive, Layout, Fit, Alignment } from "@rive-app/webgl2";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

const rive = new Rive({
  src: "sample.riv",
  canvas,
  autoplay: true,
  stateMachines: "State Machine 1",
  layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  onLoad: () => {
    rive.resizeDrawingSurfaceToCanvas();
  },
});

window.addEventListener("resize", () => {
  rive.resizeDrawingSurfaceToCanvas();
});
