
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Topology, Node, Link } from '../types';

interface Props {
  data: Topology;
  selectedId: string;
  onSelect: (id: string) => void;
  isDarkMode: boolean;
}

const TopologyGraph: React.FC<Props> = ({ data, selectedId, onSelect, isDarkMode }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Define Filters and Gradients
    const defs = svg.append("defs");

    // Standard Glow
    const glow = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-100%")
      .attr("y", "-100%")
      .attr("width", "300%")
      .attr("height", "300%");

    glow.append("feGaussianBlur")
      .attr("stdDeviation", "4")
      .attr("result", "coloredBlur");

    const feMerge = glow.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Unified Emerald Gradients
    const hubGradient = defs.append("radialGradient")
      .attr("id", "hubGradient");
    hubGradient.append("stop").attr("offset", "0%").attr("stop-color", "#10b981");
    hubGradient.append("stop").attr("offset", "100%").attr("stop-color", "#064e3b");

    const selectedGradient = defs.append("radialGradient")
      .attr("id", "selectedGradient");
    selectedGradient.append("stop").attr("offset", "0%").attr("stop-color", "#10b981");
    selectedGradient.append("stop").attr("offset", "100%").attr("stop-color", "#065f46");

    const simulation = d3.forceSimulation<any>(data.nodes)
      .force("link", d3.forceLink<any, any>(data.links).id(d => d.id).distance(140))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("radial", d3.forceRadial(220, width / 2, height / 2).strength(0.1))
      .force("collision", d3.forceCollide().radius(60));

    const g = svg.append("g");

    // 1. Links
    const link = g.append("g")
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke", (d: any) => {
        // Fix: Cast d to any because D3 forceLink mutates source/target from IDs to objects at runtime
        const isSelected = (d.source.id === selectedId || d.target.id === selectedId);
        return isSelected ? "#10b981" : "rgba(16, 185, 129, 0.1)";
      })
      .attr("stroke-opacity", 1)
      .attr("stroke-width", (d: any) => {
        // Fix: Cast d to any because D3 forceLink mutates source/target from IDs to objects at runtime
        return (d.source.id === selectedId || d.target.id === selectedId) ? 4 : 2;
      });

    // 2. Data Pulse
    const pulses = g.append("g")
      .selectAll("circle.pulse")
      .data(data.links.filter((d: any) => {
        // Fix: Cast d to any because D3 forceLink mutates source/target from IDs to objects at runtime
        return d.source.id === selectedId || d.target.id === selectedId;
      }))
      .join("circle")
      .attr("class", "pulse")
      .attr("r", 4)
      .attr("fill", "#10b981")
      .attr("filter", "url(#glow)");

    function animatePulses() {
      pulses.each(function (d: any) {
        const circle = d3.select(this);
        const repeat = () => {
          circle
            .attr("cx", d.source.x).attr("cy", d.source.y)
            .transition().duration(2000).ease(d3.easeLinear)
            .attr("cx", d.target.x).attr("cy", d.target.y)
            .on("end", repeat);
        };
        repeat();
      });
    }

    // 3. Nodes
    const nodeGroup = g.append("g")
      .selectAll("g").data(data.nodes).join("g")
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        if (d.group === 'link') onSelect(d.id);
      });

    nodeGroup.append("circle")
      .attr("r", d => d.group === 'link' ? 18 : 7)
      .attr("fill", d => d.id === selectedId ? "url(#selectedGradient)" : (d.group === 'link' ? "url(#hubGradient)" : "rgba(16, 185, 129, 0.1)"))
      .attr("filter", d => d.id === selectedId ? "url(#glow)" : "none");

    // Labels
    const labels = nodeGroup.filter(d => d.group === 'link')
      .append("g").attr("transform", "translate(0, 40)");

    labels.append("rect")
      .attr("x", -25).attr("y", -10).attr("width", 50).attr("height", 20).attr("rx", 6)
      .attr("fill", isDarkMode ? "rgba(1, 21, 12, 0.9)" : "rgba(255, 255, 255, 0.95)")
      .attr("stroke", "rgba(16, 185, 129, 0.1)");

    labels.append("text")
      .text(d => d.id.split('-')[1])
      .attr("text-anchor", "middle").attr("dy", 5)
      .attr("fill", "#064e3b")
      .attr("font-size", "10px").attr("font-weight", "900").attr("font-family", "JetBrains Mono");

    simulation.on("tick", () => {
      // Fix: Cast d to any because source/target properties are mutated to objects with x/y by D3 simulation
      link.attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y).attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
      nodeGroup.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    setTimeout(animatePulses, 100);

    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.5, 4]).on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);
    simulation.alpha(1).restart();
    return () => simulation.stop();
  }, [data, selectedId, onSelect, isDarkMode]);

  return (
    <div className="w-full h-full relative bg-white/70 dark:bg-royal-950/40 rounded-[2.5rem] overflow-hidden border border-emerald-500/10 shadow-2xl backdrop-blur-md group">
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{ backgroundImage: `radial-gradient(#10b981 1.5px, transparent 1.5px)`, backgroundSize: '40px 40px' }}>
      </div>

      <div className="absolute top-10 left-10 z-10 pointer-events-none">
        <div className="flex items-center gap-3 mb-2.5">
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse"></div>
          <h3 className="text-sm font-black text-emerald-900 dark:text-emerald-100 uppercase tracking-[0.4em]">Topology Grid</h3>
        </div>
      </div>

      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

export default TopologyGraph;
