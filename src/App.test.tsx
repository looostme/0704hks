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

  it("keeps global chrome lightweight and moves search into task square only", () => {
    render(<App />);

    expect(screen.queryByText("疗愈任务社区")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "发布" })).toHaveLength(1);
    expect(screen.getByLabelText("搜索任务、帖子、活动")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "人格岛" }));

    expect(screen.queryByLabelText("搜索任务、帖子、活动")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "公约" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "INFP 个人" })).toBeInTheDocument();
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

  it("switches task square tabs into browsable sections", () => {
    render(<App />);

    expect(screen.getByText("推荐匹配台")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "快闪" }));

    expect(screen.getByText("当前浏览：快闪")).toBeInTheDocument();
    expect(screen.getByText("平台快闪报名台")).toBeInTheDocument();
    expect(screen.queryByText("推荐匹配台")).not.toBeInTheDocument();
    expect(screen.getByText("平台快闪：周六低压散步")).toBeInTheDocument();
  });

  it("gives every task square tab a distinct function surface", () => {
    render(<App />);

    const tabFunctions = [
      ["推荐", "推荐匹配台"],
      ["同城", "同城事件地图"],
      ["附近", "附近可参与清单"],
      ["任务", "诊断书任务库"],
      ["帖子", "疗愈讨论区"],
      ["快闪", "平台快闪报名台"]
    ];

    tabFunctions.forEach(([tab, title]) => {
      fireEvent.click(screen.getByRole("button", { name: tab }));
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  it("does not reuse the personality opening across main tabs", () => {
    render(<App />);

    expect(screen.getByText("社区大厅")).toBeInTheDocument();
    expect(screen.queryByText(/人格开场页/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "人格岛" }));
    expect(screen.getByText("NF 人格开场页 · 绿色森林")).toBeInTheDocument();
    expect(screen.getByText("认知维度探索")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "搭子 / 小队" }));
    expect(screen.queryByText(/人格开场页/)).not.toBeInTheDocument();
    expect(screen.getByText("找搭子、发布找搭子、小队招募、平行房和线下快闪报名")).toBeInTheDocument();
  });

  it("opens detail browsing for community posts and recommended tasks", () => {
    render(<App />);

    fireEvent.click(screen.getAllByRole("button", { name: "浏览帖子详情" })[0]);
    expect(screen.getByRole("dialog", { name: "想整理桌面 10 分钟，有人看见就好详情" })).toBeInTheDocument();
    expect(screen.getByText("浏览入口详情")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "关闭详情" }));

    fireEvent.click(screen.getAllByRole("button", { name: "浏览推荐任务" })[0]);
    expect(screen.getByRole("dialog", { name: "咖啡馆安静共坐详情" })).toBeInTheDocument();
  });

  it("opens detail browsing from personality island tasks and team cards", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "人格岛" }));
    fireEvent.click(screen.getByRole("button", { name: "浏览岛屿任务：20 分钟低压散步" }));
    expect(screen.getByRole("dialog", { name: "20 分钟低压散步详情" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "关闭详情" }));

    fireEvent.click(screen.getByRole("button", { name: "搭子 / 小队" }));
    fireEvent.click(screen.getAllByRole("button", { name: "浏览小队详情" })[0]);
    expect(screen.getByRole("dialog", { name: "低压散步小队详情" })).toBeInTheDocument();
  });

  it("frames each main entry around its product responsibility", () => {
    render(<App />);

    expect(screen.getAllByText("诊断书任务").length).toBeGreaterThan(0);
    expect(screen.getByText("同城/附近的人和任务事件")).toBeInTheDocument();
    expect(screen.getByText("查看其他人的诊断书中的任务")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "人格岛" }));
    expect(screen.getByText("四大人格类型专属任务")).toBeInTheDocument();
    expect(screen.getByText("四大人格类型讨论")).toBeInTheDocument();
    expect(screen.getByText("岛屿互访内容")).toBeInTheDocument();
    expect(screen.getByText("疗愈分享帖子")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "搭子 / 小队" }));
    expect(screen.getByText("找搭子")).toBeInTheDocument();
    expect(screen.getByText("发布找搭子")).toBeInTheDocument();
    expect(screen.getByText("小队招募")).toBeInTheDocument();
    expect(screen.getByText("平行房")).toBeInTheDocument();
    expect(screen.getByText("线下快闪报名")).toBeInTheDocument();
  });
});
