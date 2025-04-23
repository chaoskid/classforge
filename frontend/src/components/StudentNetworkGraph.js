import React, { useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Box, Heading, Text, SimpleGrid } from '@chakra-ui/react';

const colorMap = {
  friends: '#2b8cbe',
  advice: '#a6d96a',
  disrespect: '#d7191c',
  influence: '#fdae61',
  more_time: '#f46d43',
  feedback: '#fee08b',
  popular: '#abdda4'
};

const StudentNetworkGraph = ({ name, relationships }) => {
  const fgRef = useRef();
  const containerRef = useRef();
  const nodes = [{ id: name }];
  const links = [];

  relationships.forEach(rel => {
    const target = rel.target_name || `Student ${rel.target}`;
    if (!nodes.find(n => n.id === target)) {
        nodes.push({ id: target, relType: rel.link_type });
    }
    links.push({
      source: name,
      target: target,
      color: colorMap[rel.link_type] || '#666'
    });
  });

  useEffect(() => {
    const graphInstance = fgRef.current;
  
    if (graphInstance) {
      
      // Fit graph nicely inside the box
      setTimeout(() => {
        graphInstance.zoomToFit(400, 50);
      }, 300);
  
      // Freeze the graph layout
    //   setTimeout(() => {
    //     graphInstance.pauseAnimation();
    //   }, 1500);
    }
    if (fgRef.current && containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
    
        fgRef.current.width(offsetWidth);
        fgRef.current.height(offsetHeight);
        fgRef.current.zoomToFit(400, 50); // Adjust this delay as needed
      }
  }, []);
  

  return (
    <>
    <Box
  w="100%"
  h="400px" // Fixed height
  overflow="hidden"
  borderRadius="md"
  bg="white"
  p={2}
  position="relative"
  style={{ pointerEvents: 'auto' }}
>
    <ForceGraph2D
        ref={fgRef}
        width={400}
        height={400}
        graphData={{ nodes, links }}
        nodeLabel="id"
        linkColor={() => '#333'}
        nodeAutoColorBy="id"
        enableNodeDrag={false} 
        enableZoomPanInteraction={true} // ✅ Allow zoom/pan
        // width={undefined} // ✅ Let it fill the container
        // height={undefined}
        
        nodeCanvasObject={(node, ctx, globalScale) => {
            const radius = 6;
            const fontSize = 12 / globalScale;
        
            // Colored circle for relationship type
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.relType ? colorMap[node.relType] : '#888';
            ctx.fill();
        
            // Add node label
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.fillStyle = 'black';
            ctx.fillText(node.id, node.x, node.y + 14);
          }}  
        // linkDirectionalArrowLength={6}
        // linkDirectionalArrowRelPos={1}
        onZoom={(zoom) => {
            // Optional: restrict zoom levels if needed
            if (zoom < 0.5) fgRef.current.zoom(0.5);
            if (zoom > 3) fgRef.current.zoom(3);
          }}
          onEnd={(...args) => {
            // Optionally handle drag end
          }}
      />
      </Box>
      <Box mt={4}>
  <Heading size="sm" mb={2}>🗂️ Legend</Heading>
  <SimpleGrid columns={2} spacing={2}>
    {Object.entries(colorMap).map(([type, color]) => (
      <Box key={type} display="flex" alignItems="center">
        <Box w="12px" h="12px" bg={color} borderRadius="full" mr={2}></Box>
        <Text fontSize="sm">{type}</Text>
      </Box>
    ))}
  </SimpleGrid>
</Box>
    </>
  );
};


export default StudentNetworkGraph;
