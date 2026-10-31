// game.js
// Estado y reglas. Depende de globals de maze.js: MAZE, TUNNEL_ROW,
// PACMAN_START, GHOST_STARTS.

const DIRS = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};
const OPPOSITE = { left: 'right', right: 'left', up: 'down', down: 'up' };

const PACMAN_SPEED = 0.125; // 1/8 celda/frame -> alinea cada 8 frames
const GHOST_SPEED = 0.1;    // 1/10 celda/frame
const POWER_DURATION = 360;
const GHOST_EXIT_TARGET = { x: 13, y: 11 };
const PEN_MIN_X = 11;
const PEN_MAX_X = 16;
const PEN_MIN_Y = 13;
const PEN_MAX_Y = 15;
const PEN_WAYPOINTS = [
  { x: 11, y: 13 },
  { x: 16, y: 13 },
  { x: 16, y: 15 },
  { x: 11, y: 15 },
];
const PATROL_CORNERS = [
  { x: 1, y: 1 },
  { x: 26, y: 1 },
  { x: 26, y: 29 },
  { x: 1, y: 29 },
];

// Crea una partida nueva. Copia MAZE (pristino) a game.grid para poder comer
// dots sin destruir el original, y reiniciar.
function createGame() {
  const grid = MAZE.map( ( row ) => row.slice() );
  // La celda de inicio de Pacman arranca sin dot.
  grid[ PACMAN_START.y ][ PACMAN_START.x ] = 0;

  let dots = 0;
  for ( const row of grid ) {
    for ( const v of row ) if ( v === 2 || v === 4 ) dots++;
  }

  return {
    state: 'start',
    score: 0,
    lives: 3,
    elapsedFrames: 0,
    fotogramasPoderRestantes: 0,
    dotsRemaining: dots,
    grid,
    pacman: {
      x: PACMAN_START.x,
      y: PACMAN_START.y,
      dir: 'left',
      nextDir: null,
      speed: PACMAN_SPEED,
    },
    ghosts: GHOST_STARTS.map( ( g, i ) => ( {
      x: g.x,
      y: g.y,
      dir: 'up',
      speed: GHOST_SPEED,
      kind: g.kind,
      releaseDelay: g.releaseDelay,
      releaseState: 'espera',
      penWaypointIndex: i % PEN_WAYPOINTS.length,
      patrolCornerIndex: 0,
    } ) ),
  };
}

function aligned( v ) {
  return Math.abs( v - Math.round( v ) ) < 1e-3;
}

// Una celda es muro para el actor dado?
//   pacman: bloqueado por pared (1) y puerta (3)
//   ghost:  bloqueado solo por pared (1)
function isWall( grid, x, y, actor ) {
  if ( y < 0 || y >= grid.length ) return true;
  if ( x < 0 || x >= grid[ 0 ].length ) return true;
  const v = grid[ y ][ x ];
  if ( v === 1 ) return true;
  if ( v === 3 && actor === 'pacman' ) return true;
  return false;
}

// Puede el actor avanzar desde (x,y) en la direccion dir?
function canMove( grid, x, y, dir, actor ) {
  const d = DIRS[ dir ];
  if ( !d ) return false;
  const tx = x + d.x;
  const ty = y + d.y;
  // Tunel: salir por un borde en la fila del tunel siempre es valido.
  if ( ty === TUNNEL_ROW && ( tx < 0 || tx >= grid[ 0 ].length ) ) return true;
  return !isWall( grid, tx, ty, actor );
}

function wrapTunnel( a, width ) {
  if ( Math.round( a.y ) === TUNNEL_ROW ) {
    if ( a.x < 0 ) a.x += width;
    else if ( a.x >= width ) a.x -= width;
  }
}

function movePacman( game ) {
  const p = game.pacman;
  const grid = game.grid;
  const width = grid[ 0 ].length;

  if ( aligned( p.x ) && aligned( p.y ) ) {
    p.x = Math.round( p.x );
    p.y = Math.round( p.y );

    // Aplicar giro pendiente si es posible.
    if ( p.nextDir && canMove( grid, p.x, p.y, p.nextDir, 'pacman' ) ) {
      p.dir = p.nextDir;
      p.nextDir = null;
    }
    // Comer dot o power pellet.
    if ( grid[ p.y ][ p.x ] === 2 || grid[ p.y ][ p.x ] === 4 ) {
      const esPowerPellet = grid[ p.y ][ p.x ] === 4;
      grid[ p.y ][ p.x ] = 0;
      game.score += esPowerPellet ? 50 : 10;
      if ( esPowerPellet ) game.fotogramasPoderRestantes = POWER_DURATION;
      game.dotsRemaining--;
    }
    // Si no puede seguir, se detiene en la celda.
    if ( !canMove( grid, p.x, p.y, p.dir, 'pacman' ) ) return;
  }

  const d = DIRS[ p.dir ];
  p.x += d.x * p.speed;
  p.y += d.y * p.speed;
  wrapTunnel( p, width );
}

function nextCell( grid, x, y, dir ) {
  const d = DIRS[ dir ];
  let nx = x + d.x;
  const ny = y + d.y;

  if ( ny === TUNNEL_ROW && nx < 0 ) nx = grid[ 0 ].length - 1;
  else if ( ny === TUNNEL_ROW && nx >= grid[ 0 ].length ) nx = 0;

  return { x: nx, y: ny };
}

function shortestGhostDirection( grid, startX, startY, targetX, targetY ) {
  const startKey = startX + ',' + startY;
  const queue = [ { x: startX, y: startY, firstDir: null } ];
  const visited = new Set( [ startKey ] );

  for ( let i = 0; i < queue.length; i++ ) {
    const current = queue[ i ];
    if ( current.x === targetX && current.y === targetY ) {
      return current.firstDir;
    }

    for ( const dir of Object.keys( DIRS ) ) {
      if ( !canMove( grid, current.x, current.y, dir, 'ghost' ) ) continue;
      const next = nextCell( grid, current.x, current.y, dir );
      const key = next.x + ',' + next.y;
      if ( visited.has( key ) ) continue;
      visited.add( key );
      queue.push( {
        x: next.x,
        y: next.y,
        firstDir: current.firstDir || dir,
      } );
    }
  }

  return null;
}

function canMoveInPen( grid, x, y, dir ) {
  const next = nextCell( grid, x, y, dir );
  return next.x >= PEN_MIN_X && next.x <= PEN_MAX_X &&
    next.y >= PEN_MIN_Y && next.y <= PEN_MAX_Y &&
    canMove( grid, x, y, dir, 'ghost' );
}

function shortestPenDirection( grid, startX, startY, targetX, targetY ) {
  const startKey = startX + ',' + startY;
  const queue = [ { x: startX, y: startY, firstDir: null } ];
  const visited = new Set( [ startKey ] );

  for ( let i = 0; i < queue.length; i++ ) {
    const current = queue[ i ];
    if ( current.x === targetX && current.y === targetY ) {
      return current.firstDir;
    }

    for ( const dir of Object.keys( DIRS ) ) {
      if ( !canMoveInPen( grid, current.x, current.y, dir ) ) continue;
      const next = nextCell( grid, current.x, current.y, dir );
      const key = next.x + ',' + next.y;
      if ( visited.has( key ) ) continue;
      visited.add( key );
      queue.push( {
        x: next.x,
        y: next.y,
        firstDir: current.firstDir || dir,
      } );
    }
  }

  return null;
}

function moveGhostInPen( game, g ) {
  const grid = game.grid;
  let target = PEN_WAYPOINTS[ g.penWaypointIndex ];

  if ( g.x === target.x && g.y === target.y ) {
    g.penWaypointIndex = ( g.penWaypointIndex + 1 ) % PEN_WAYPOINTS.length;
    target = PEN_WAYPOINTS[ g.penWaypointIndex ];
  }

  const choices = Object.keys( DIRS ).filter(
    ( dir ) => canMoveInPen( grid, g.x, g.y, dir )
  );
  g.dir = shortestPenDirection( grid, g.x, g.y, target.x, target.y ) ||
    choices[ 0 ] || g.dir;

  if ( !canMoveInPen( grid, g.x, g.y, g.dir ) ) return;
  const d = DIRS[ g.dir ];
  g.x += d.x * g.speed;
  g.y += d.y * g.speed;
}

function ambusherTarget( game ) {
  const grid = game.grid;
  const p = game.pacman;
  let x = Math.round( p.x );
  let y = Math.round( p.y );
  let lastValid = { x, y };

  for ( let i = 0; i < 4; i++ ) {
    if ( !canMove( grid, x, y, p.dir, 'ghost' ) ) break;
    const next = nextCell( grid, x, y, p.dir );
    x = next.x;
    y = next.y;
    lastValid = { x, y };
  }

  return lastValid;
}

function patrollerTarget( g ) {
  let target = PATROL_CORNERS[ g.patrolCornerIndex ];
  if ( g.x === target.x && g.y === target.y ) {
    g.patrolCornerIndex = ( g.patrolCornerIndex + 1 ) % PATROL_CORNERS.length;
    target = PATROL_CORNERS[ g.patrolCornerIndex ];
  }
  return target;
}

function decideGhost( game, g ) {
  const grid = game.grid;
  const p = game.pacman;

  const options = Object.keys( DIRS ).filter(
    ( dir ) => dir !== OPPOSITE[ g.dir ] && canMove( grid, g.x, g.y, dir, 'ghost' )
  );
  // Sin salida (callejon): permitir el giro de 180.
  const reverse = OPPOSITE[ g.dir ];
  const choices = options.length ? options : (
    canMove( grid, g.x, g.y, reverse, 'ghost' ) ? [ reverse ] : []
  );

  if ( g.kind === 'hunter' ) {
    const px = Math.round( p.x );
    const py = Math.round( p.y );
    g.dir = shortestGhostDirection( grid, g.x, g.y, px, py ) || choices[ 0 ] || g.dir;
  } else if ( g.kind === 'ambusher' ) {
    const target = ambusherTarget( game );
    g.dir = shortestGhostDirection( grid, g.x, g.y, target.x, target.y ) || choices[ 0 ] || g.dir;
  } else if ( g.kind === 'patroller' ) {
    const target = patrollerTarget( g );
    g.dir = shortestGhostDirection( grid, g.x, g.y, target.x, target.y ) || choices[ 0 ] || g.dir;
  } else if ( g.kind === 'erratic' && choices.length ) {
    g.dir = choices[ Math.floor( Math.random() * choices.length ) ];
  }
}

function moveGhostToExit( game, g ) {
  const target = GHOST_EXIT_TARGET;

  if ( g.x === target.x && g.y === target.y ) {
    g.releaseState = 'activo';
    return;
  }

  g.dir = shortestGhostDirection( game.grid, g.x, g.y, target.x, target.y ) || g.dir;
}

function moveGhost( game, g ) {
  const grid = game.grid;
  const width = grid[ 0 ].length;

  if ( g.releaseState === 'espera' ) {
    if ( game.elapsedFrames < g.releaseDelay ) {
      if ( aligned( g.x ) && aligned( g.y ) ) {
        g.x = Math.round( g.x );
        g.y = Math.round( g.y );
        moveGhostInPen( game, g );
      } else {
        const d = DIRS[ g.dir ];
        g.x += d.x * g.speed;
        g.y += d.y * g.speed;
      }
      return;
    }
    g.releaseState = 'salida';
  }

  if ( g.releaseState === 'salida' ) {
    if ( aligned( g.x ) && aligned( g.y ) ) {
      g.x = Math.round( g.x );
      g.y = Math.round( g.y );
      moveGhostToExit( game, g );
      if ( g.releaseState === 'activo' ) return;
      if ( !canMove( grid, g.x, g.y, g.dir, 'ghost' ) ) return;
    }

    const d = DIRS[ g.dir ];
    g.x += d.x * g.speed;
    g.y += d.y * g.speed;
    wrapTunnel( g, width );
    return;
  }

  if ( aligned( g.x ) && aligned( g.y ) ) {
    g.x = Math.round( g.x );
    g.y = Math.round( g.y );
    decideGhost( game, g );
    if ( !canMove( grid, g.x, g.y, g.dir, 'ghost' ) ) return;
  }

  const d = DIRS[ g.dir ];
  g.x += d.x * g.speed;
  g.y += d.y * g.speed;
  wrapTunnel( g, width );
}

function resetPositions( game ) {
  const p = game.pacman;
  p.x = PACMAN_START.x;
  p.y = PACMAN_START.y;
  p.dir = 'left';
  p.nextDir = null;
  game.elapsedFrames = 0;
  game.ghosts.forEach( ( g, i ) => {
    g.x = GHOST_STARTS[ i ].x;
    g.y = GHOST_STARTS[ i ].y;
    g.dir = 'up';
    g.releaseDelay = GHOST_STARTS[ i ].releaseDelay;
    g.releaseState = 'espera';
    g.penWaypointIndex = i % PEN_WAYPOINTS.length;
    g.patrolCornerIndex = 0;
  } );
}

function collides( a, b ) {
  return Math.abs( a.x - b.x ) < 0.5 && Math.abs( a.y - b.y ) < 0.5;
}

function update( game ) {
  game.elapsedFrames++;
  movePacman( game );
  game.ghosts.forEach( ( g ) => moveGhost( game, g ) );

  for ( const g of game.ghosts ) {
    if ( collides( game.pacman, g ) ) {
      game.lives--;
      if ( game.lives <= 0 ) {
        game.state = 'lost';
        return;
      }
      resetPositions( game );
      break;
    }
  }

  if ( game.dotsRemaining <= 0 ) game.state = 'won';
}

window.createGame = createGame;
window.update = update;
window.DIRS = DIRS;
