Group ID and members' names and emails.
- Group 2: Cheung Wing Ho (whcheungam@connect.ust.hk), Mo Ka Lok (klmoaa@connect.ust.hk)


Important: Specify which specific submitted files contain code that you implemented from scratch (i.e., not from libraries, engines). 
You are encouraged to refer to your report if you feel it helps the description (e.g., "The file x.cpp implements the method described in section X of the report").
main.js
- src/MyMinecraftControls.js: The control tailored for this project. Features are mainly described in section 3.1.1 and partly in section 3.1.2 (user interaction when placing/removing blocks).
- src/World.js: Storing world data and managing the world/block CRS. Features are mainly described in section 3.1.2 (block CRS + efforts on block selection), 3.1.3 (water generation)
- main.js: Modularized and greatly modified from the original code base (90+% is our implementation). Features are described in section 3.1.2 (dynamic geometry modeling), 3.2.1 (lighting and shadow)
- shaders/water.vert.js: The vertex shader for water blocks.
- shaders/water.frag.js: The fragment shader for water blocks. Features are described in section 3.2.
...


Instructions on how to run your program.
How to open the webpage:
1. Make sure you have installed npm (https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
2. Make sure you have installed http-server using npm: npm install --global http-server
3. run http-server 
4. Open browser and visit: http://127.0.0.1:8080


The workload breakdown for project members if it is a group of two. This should include a sentence briefly stating what each member did and a percentage workload breakdown (if members cannot agree on the percentage breakdown, please email the course staff separately).
Cheung Wing Ho: Modularization of the original code base + Game mechanics - 50%
Mo Ka Lok: Water shader - 50%