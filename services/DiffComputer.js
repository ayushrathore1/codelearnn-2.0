/**
 * Diff Computation Utility
 * 
 * Computes differences between path states for:
 * - Version comparison
 * - Efficient storage (delta encoding)
 * - Change detection
 */

class DiffComputer {
  /**
   * Compute diff between two path states
   */
  static computePathDiff(oldState, newState) {
    return {
      title: this._computeFieldDiff(oldState.title, newState.title),
      description: this._computeFieldDiff(oldState.description, newState.description),
      status: this._computeFieldDiff(oldState.status, newState.status),
      visibility: this._computeFieldDiff(oldState.visibility, newState.visibility),
      nodes: this._computeNodesDiff(
        oldState.structureGraph?.nodes || [],
        newState.structureGraph?.nodes || []
      ),
      edges: this._computeEdgesDiff(
        oldState.structureGraph?.edges || [],
        newState.structureGraph?.edges || []
      ),
      skills: this._computeArrayDiff(
        oldState.inferredSkills || [],
        newState.inferredSkills || []
      ),
      careers: this._computeArrayDiff(
        oldState.inferredCareers || [],
        newState.inferredCareers || []
      )
    };
  }

  /**
   * Compute field diff (for simple values)
   */
  static _computeFieldDiff(oldValue, newValue) {
    if (oldValue === newValue) {
      return null; // No change
    }
    return {
      from: oldValue,
      to: newValue
    };
  }

  /**
   * Compute diff between node arrays
   */
  static _computeNodesDiff(oldNodes, newNodes) {
    const oldMap = new Map(oldNodes.map(n => [n.id, n]));
    const newMap = new Map(newNodes.map(n => [n.id, n]));

    const added = [];
    const removed = [];
    const modified = [];
    const reordered = [];

    // Find removed nodes
    for (const [id, node] of oldMap) {
      if (!newMap.has(id)) {
        removed.push(node);
      }
    }

    // Find added and modified nodes
    for (const [id, newNode] of newMap) {
      if (!oldMap.has(id)) {
        added.push(newNode);
      } else {
        const oldNode = oldMap.get(id);
        const changes = this._getNodeChanges(oldNode, newNode);
        if (Object.keys(changes).length > 0) {
          modified.push({ id, changes });
        }
        // Check for reorder
        if (oldNode.order !== newNode.order) {
          reordered.push({ id, from: oldNode.order, to: newNode.order });
        }
      }
    }

    return {
      added,
      removed,
      modified,
      reordered,
      hasChanges: added.length > 0 || removed.length > 0 || 
                  modified.length > 0 || reordered.length > 0
    };
  }

  /**
   * Get specific changes between two nodes
   */
  static _getNodeChanges(oldNode, newNode) {
    const changes = {};
    
    const fieldsToCompare = ['title', 'isCompleted', 'completedAt'];
    
    for (const field of fieldsToCompare) {
      if (oldNode[field] !== newNode[field]) {
        changes[field] = {
          from: oldNode[field],
          to: newNode[field]
        };
      }
    }
    
    return changes;
  }

  /**
   * Compute diff between edge arrays
   */
  static _computeEdgesDiff(oldEdges, newEdges) {
    const edgeKey = (e) => `${e.from}->${e.to}`;
    
    const oldSet = new Set(oldEdges.map(edgeKey));
    const newSet = new Set(newEdges.map(edgeKey));

    const added = newEdges.filter(e => !oldSet.has(edgeKey(e)));
    const removed = oldEdges.filter(e => !newSet.has(edgeKey(e)));

    return {
      added,
      removed,
      hasChanges: added.length > 0 || removed.length > 0
    };
  }

  /**
   * Compute diff between simple arrays
   */
  static _computeArrayDiff(oldArray, newArray) {
    const oldSet = new Set(oldArray);
    const newSet = new Set(newArray);

    const added = newArray.filter(item => !oldSet.has(item));
    const removed = oldArray.filter(item => !newSet.has(item));

    return {
      added,
      removed,
      hasChanges: added.length > 0 || removed.length > 0
    };
  }

  /**
   * Apply diff to restore a state
   */
  static applyDiff(baseState, diff) {
    const result = { ...baseState };

    // Apply simple field diffs
    ['title', 'description', 'status', 'visibility'].forEach(field => {
      if (diff[field]) {
        result[field] = diff[field].to;
      }
    });

    // Apply node diffs
    if (diff.nodes?.hasChanges) {
      const nodes = [...(baseState.structureGraph?.nodes || [])];
      
      // Remove nodes
      const removedIds = new Set(diff.nodes.removed.map(n => n.id));
      result.structureGraph = {
        ...result.structureGraph,
        nodes: nodes.filter(n => !removedIds.has(n.id))
      };
      
      // Add nodes
      result.structureGraph.nodes.push(...diff.nodes.added);
      
      // Apply modifications
      for (const mod of diff.nodes.modified) {
        const node = result.structureGraph.nodes.find(n => n.id === mod.id);
        if (node) {
          for (const [field, change] of Object.entries(mod.changes)) {
            node[field] = change.to;
          }
        }
      }
      
      // Apply reorder
      for (const reorder of diff.nodes.reordered) {
        const node = result.structureGraph.nodes.find(n => n.id === reorder.id);
        if (node) {
          node.order = reorder.to;
        }
      }
    }

    // Apply edge diffs
    if (diff.edges?.hasChanges) {
      const edges = [...(baseState.structureGraph?.edges || [])];
      
      // Remove edges
      const edgeKey = (e) => `${e.from}->${e.to}`;
      const removedKeys = new Set(diff.edges.removed.map(edgeKey));
      result.structureGraph.edges = edges.filter(e => !removedKeys.has(edgeKey(e)));
      
      // Add edges
      result.structureGraph.edges.push(...diff.edges.added);
    }

    // Apply array diffs
    if (diff.skills?.hasChanges) {
      const skills = new Set(baseState.inferredSkills || []);
      diff.skills.removed.forEach(s => skills.delete(s));
      diff.skills.added.forEach(s => skills.add(s));
      result.inferredSkills = [...skills];
    }

    if (diff.careers?.hasChanges) {
      const careers = new Set(baseState.inferredCareers || []);
      diff.careers.removed.forEach(c => careers.delete(c));
      diff.careers.added.forEach(c => careers.add(c));
      result.inferredCareers = [...careers];
    }

    return result;
  }

  /**
   * Summarize diff for human-readable display
   */
  static summarizeDiff(diff) {
    const summary = [];

    if (diff.title) {
      summary.push(`Title changed from "${diff.title.from}" to "${diff.title.to}"`);
    }

    if (diff.status) {
      summary.push(`Status changed from "${diff.status.from}" to "${diff.status.to}"`);
    }

    if (diff.nodes?.hasChanges) {
      if (diff.nodes.added.length > 0) {
        summary.push(`Added ${diff.nodes.added.length} video(s)`);
      }
      if (diff.nodes.removed.length > 0) {
        summary.push(`Removed ${diff.nodes.removed.length} video(s)`);
      }
      if (diff.nodes.modified.length > 0) {
        const completions = diff.nodes.modified.filter(m => m.changes.isCompleted);
        if (completions.length > 0) {
          summary.push(`Marked ${completions.length} video(s) as completed`);
        }
      }
      if (diff.nodes.reordered.length > 0) {
        summary.push(`Reordered ${diff.nodes.reordered.length} video(s)`);
      }
    }

    if (diff.edges?.hasChanges) {
      if (diff.edges.added.length > 0) {
        summary.push(`Added ${diff.edges.added.length} connection(s)`);
      }
      if (diff.edges.removed.length > 0) {
        summary.push(`Removed ${diff.edges.removed.length} connection(s)`);
      }
    }

    return summary.length > 0 ? summary : ['No significant changes'];
  }
}

module.exports = DiffComputer;
