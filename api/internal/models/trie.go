package models

import (
	"strings"
)

// TrieNode represents a node in the Trie data structure
type TrieNode struct {
	Children    map[rune]*TrieNode `json:"children,omitempty"`
	Securities  []Securities       `json:"securities,omitempty"`
	IsEndOfWord bool               `json:"is_end,omitempty"`
}

// Trie represents the complete Trie data structure
type Trie struct {
	Root *TrieNode `json:"root"`
	Size int       `json:"size"`
}

// NewTrie creates a new empty Trie
func NewTrie() *Trie {
	return &Trie{
		Root: &TrieNode{
			Children: make(map[rune]*TrieNode),
		},
		Size: 0,
	}
}

// Insert adds a security to the Trie using its ticker as the key
func (t *Trie) Insert(security Securities) {
	ticker := strings.ToUpper(security.Ticker)
	node := t.Root

	// Traverse/create the path for each character in the ticker
	for _, char := range ticker {
		if node.Children == nil {
			node.Children = make(map[rune]*TrieNode)
		}

		if _, exists := node.Children[char]; !exists {
			node.Children[char] = &TrieNode{
				Children: make(map[rune]*TrieNode),
			}
		}
		node = node.Children[char]
	}

	// Mark the end of the ticker and store the complete security info
	node.IsEndOfWord = true
	if node.Securities == nil {
		node.Securities = make([]Securities, 0)
	}

	// Store the complete Securities struct
	node.Securities = append(node.Securities, security)
	t.Size++
}

// Search finds all securities that start with the given prefix
func (t *Trie) Search(prefix string) []Securities {
	prefix = strings.ToUpper(prefix)
	node := t.Root

	// Navigate to the prefix node
	for _, char := range prefix {
		if node.Children == nil {
			return []Securities{}
		}

		if child, exists := node.Children[char]; exists {
			node = child
		} else {
			return []Securities{}
		}
	}

	// Collect all securities from this node and its children
	var results []Securities
	t.collectSecurities(node, &results)
	return results
}

// collectSecurities recursively collects all securities from a node and its children
func (t *Trie) collectSecurities(node *TrieNode, results *[]Securities) {
	if node == nil {
		return
	}

	// Add securities at this node
	if node.IsEndOfWord && node.Securities != nil {
		*results = append(*results, node.Securities...)
	}

	// Recursively collect from children
	if node.Children != nil {
		for _, child := range node.Children {
			t.collectSecurities(child, results)
		}
	}
}

// GetExactMatch returns securities that exactly match the given ticker
func (t *Trie) GetExactMatch(ticker string) []Securities {
	ticker = strings.ToUpper(ticker)
	node := t.Root

	// Navigate to the exact ticker node
	for _, char := range ticker {
		if node.Children == nil {
			return []Securities{}
		}

		if child, exists := node.Children[char]; exists {
			node = child
		} else {
			return []Securities{}
		}
	}

	// Return securities only if this is an end of word
	if node.IsEndOfWord && node.Securities != nil {
		return node.Securities
	}

	return []Securities{}
}

// CompressedTrieResponse represents the response format for the API
type CompressedTrieResponse struct {
	Trie      *Trie  `json:"trie"`
	Count     int    `json:"count"`
	Version   string `json:"version"`
	BuildTime string `json:"build_time"`
}
