import "./styles.css";

export default class FabTimeout {
    private readonly parentAnchor: HTMLElement;
    private readonly fabToOuter: HTMLDivElement;
    private readonly fabToInner: HTMLDivElement;
    private readonly svgElement: SVGElement;
    private overlayCircle: SVGCircleElement | null = null;
    private idTimeout: NodeJS.Timeout | null = null;
    private idInterval: NodeJS.Timeout | null = null;
    private timeoutAtMs: number | null = null;
    private initialTimeout: number | null = null;
    private readonly timeoutElapsedCb: () => void;

    private static readonly svgRadius = 20;
    private static readonly width = 4;
    private static readonly size = 100;

    public constructor(querySelector: string, iconClasses: string, timeoutElapsedCb: () => void) {
        this.timeoutElapsedCb = timeoutElapsedCb;
        this.parentAnchor = document.querySelector(querySelector) ?? FabTimeout.throwError("Parent anchor not found!");

        this.fabToOuter = document.createElement("div");
        this.fabToOuter.classList.add("fab-to");

        this.fabToInner = document.createElement("div");
        this.fabToInner.classList.add("fab-to--inner-sticky");

        const iconElt = document.createElement("i");
        for (let iconClass of iconClasses.split(" ")) {
            iconElt.classList.add(iconClass.trim());
        }
        iconElt.classList.add("fab-to--icon");

        this.fabToOuter.addEventListener("click", () => this.timeoutElapsedCb());

        this.fabToOuter.appendChild(this.fabToInner);
        this.svgElement = this.genSvg();
        this.fabToInner.appendChild(this.svgElement);
        this.fabToInner.appendChild(iconElt);
        this.parentAnchor.appendChild(this.fabToOuter);
    }

    public startCountdown(timeout: number): void {
        this.initialTimeout = timeout;
        this.timeoutAtMs = new Date().getTime() + timeout;
        this.idTimeout = setTimeout(this.timeoutElapsed.bind(this), timeout);
        this.idInterval = setInterval(this.updateHtmlElement.bind(this), 50);
    }

    private updateHtmlElement(pct?: number): void {
        const value = pct ?? this.remainingPct;
        if (value === null) {
            return;
        }
        this.updateOverlayCircle();
    }

    private timeoutElapsed(): void {
        this.timeoutElapsedCb();
        this.stopCountdown();
        this.updateHtmlElement(0);
    }

    public stopCountdown(): void {
        if (this.idTimeout) clearTimeout(this.idTimeout);
        if (this.idInterval) clearInterval(this.idInterval);
    }

    public resetCountdown(): void {
        this.stopCountdown();
        this.updateHtmlElement(100);
    }

    private get remainingMs(): number | null {
        if (!this.timeoutAtMs) {
            return null;
        }
        return this.timeoutAtMs - new Date().getTime();
    }

    /**
     * Returns the percentage of time remaining between 0 and 100 (included)
     */
    private get remainingPct(): number | null {
        if (!this.remainingMs || !this.initialTimeout) {
            return null;
        }
        return (this.remainingMs / this.initialTimeout) * 100;
    }

    private get viewBoxSize(): number {
        return FabTimeout.svgRadius / (1 - Number(FabTimeout.width) / FabTimeout.size);
    }

    private get strokeWidth(): number {
        return Number(FabTimeout.width) / +FabTimeout.size * this.viewBoxSize * 2;
    }

    private get circumference(): number {
        return 2 * Math.PI * FabTimeout.svgRadius;
    }

    public get strokeDashArray(): string {
        return (Math.round(this.circumference * 1000) / 1000) + "";
    }

    public get strokeDashOffset(): string {
        return ((100 - (this.remainingPct ?? 100)) / 100) * this.circumference + "px";
    }

    private static throwError<T>(msg: string): T {
        throw new Error(msg);
    }

    private genSvg(): SVGElement {
        const res = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGElement;
        res.classList.add("fab-to--svg");
        res.setAttribute("viewBox", `${this.viewBoxSize} ${this.viewBoxSize} ${2 * this.viewBoxSize} ${2 * this.viewBoxSize}`);
        this.overlayCircle = this.genCircle("overlay", this.strokeDashOffset);
        res.appendChild(this.genCircle("underlay", "0"));
        res.appendChild(this.overlayCircle);
        return res;
    }

    private genCircle(name: string, dashOffset: string): SVGCircleElement {
        const res = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        res.classList.add(`fab-to--svg-${name}`);
        res.setAttribute("fill", "transparent");
        res.setAttribute("stroke", "#ff0000");
        res.setAttribute("cx", (2 * this.viewBoxSize) + "");
        res.setAttribute("cy", (2 * this.viewBoxSize) + "");
        res.setAttribute("r", FabTimeout.svgRadius + "");
        res.setAttribute("stroke-width", this.strokeWidth + "");
        res.setAttribute("stroke-dasharray", this.strokeDashArray);
        res.setAttribute("stroke-dashoffset", dashOffset);

        return res;
    }

    private updateOverlayCircle(): void {
        this.overlayCircle?.setAttribute("stroke-dashoffset", this.strokeDashOffset);
    }
}