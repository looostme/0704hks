import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("community MVP interface", () => {
  it("keeps the sidebar focused on the three MVP pillars", () => {
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "主导航" });
    expect(within(navigation).getByRole("button", { name: "任务广场" })).toBeInTheDocument();
    expect(within(navigation).getByRole("button", { name: "人格岛" })).toBeInTheDocument();
    expect(within(navigation).getByRole("button", { name: "搭子 / 小队" })).toBeInTheDocument();
    expect(within(navigation).queryByText("我的复盘")).not.toBeInTheDocument();
  });

  it("publishes a task post and shows suitable recommendation recipients", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "发布" }));
    fireEvent.click(screen.getByRole("button", { name: "发任务帖" }));
    fireEvent.change(screen.getByLabelText("标题"), {
      target: { value: "想找一个安静陪走的低压散步任务" }
    });
    fireEvent.click(screen.getByRole("button", { name: "发布到任务广场" }));

    expect(screen.getByText("想找一个安静陪走的低压散步任务")).toBeInTheDocument();
    expect(screen.getByText("已为这条任务推荐给")).toBeInTheDocument();
    expect(screen.getByText("林澈")).toBeInTheDocument();
  });

  it("allows joining a team card from the partner and team section", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "搭子 / 小队" }));
    fireEvent.click(screen.getAllByRole("button", { name: "加入小队" })[0]);

    expect(screen.getByText("已加入低压散步小队")).toBeInTheDocument();
  });
});
